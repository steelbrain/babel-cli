import os from 'os'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import makeDir from 'make-dir'
import chokidar from 'chokidar'
import anymatch from 'anymatch'
import debounce from 'lodash/debounce'
import childProcess from 'child_process'
import { PromiseQueue } from 'sb-promise-queue'

import iterate from './iterate'
import { getSha1, getCacheDB, getBabelCore, logError, loadConfigFromRoot, posixifyPath } from './helpers'
import { Config } from './types'

async function main(cliConfig: Config): Promise<void> {
  const config = await loadConfigFromRoot(cliConfig.rootDirectory, cliConfig)
  const resolvedSourceDirectory = path.resolve(config.rootDirectory, config.sourceDirectory)
  const resolvedOutputDirectory = path.resolve(config.rootDirectory, config.outputDirectory ?? '')

  if (config.printConfig) {
    console.log('CLI Config', JSON.stringify(config, null, 2))
    console.log('Resolved Config (with config merged from Manifest)', JSON.stringify(config, null, 2))
    console.log('resolvedSourceDirectory', resolvedSourceDirectory)
    console.log('resolvedOutputDirectory', resolvedOutputDirectory)
    process.exit(1)
  }

  if (!config.watch && config.execute) {
    console.error('ERROR: --execute is not supported without --watch')
    process.exit(1)
  }
  if (!config.outputDirectory) {
    console.log('ERROR: You must specify output directory')
    process.exit(1)
  }

  config.sourceDirectory = resolvedSourceDirectory
  config.outputDirectory = resolvedOutputDirectory

  // Sort the longest extensions to the shortest. This will help with replace
  config.extensions.sort((a, b) => b.length - a.length)

  let spawnedProcess: childProcess.ChildProcess | null = null

  const timestampCache = await getCacheDB(config.sourceDirectory, !config.resetCache)
  const babelCore = getBabelCore(config.sourceDirectory)
  const transformationQueue = new PromiseQueue({ concurrency: os.cpus().length })
  const getOutputFilePath = (filePath: string) => {
    const foundExt = config.extensions.find((ext) => filePath.endsWith(ext))
    if (foundExt != null) {
      return `${filePath.slice(0, -1 * foundExt.length)}.js`
    }
    return filePath
  }

  function log(...items: string[]) {
    if (config.execute) {
      console.log(`${chalk.yellow('[sb-babel-cli]')}`, ...items)
    } else {
      console.log(...items)
    }
  }

  async function processFile(sourceFile: string, outputFile: string, stats: fs.Stats) {
    if (!config.extensions.includes(path.extname(sourceFile))) return

    const transformed = await babelCore.transformFileAsync(sourceFile, {
      root: config.rootDirectory,
      sourceMaps: config.sourceMaps === 'inline' ? 'inline' : config.sourceMaps,
    })
    if (transformed == null || transformed.code == null) {
      return
    }
    await makeDir(path.dirname(outputFile))

    const mapFile = `${outputFile}.map`
    let outputContents = transformed.code
    if (config.sourceMaps === true) {
      outputContents += `\n\n//# sourceMappingURL=${path.basename(mapFile)}`
    }

    await Promise.all([
      fs.promises.writeFile(outputFile, outputContents, {
        mode: stats.mode,
      }),
      // Write source maps if option is given.
      config.sourceMaps && config.sourceMaps !== 'inline'
        ? fs.promises.writeFile(mapFile, JSON.stringify(transformed.map, null, 2))
        : null,
    ])
    log(path.relative(config.rootDirectory, sourceFile), '->', path.relative(config.rootDirectory, outputFile))
    timestampCache.set(getSha1(sourceFile), stats.mtime.getTime()).write()
  }

  function execute() {
    if (!config.execute) {
      return
    }

    if (spawnedProcess == null) {
      log(chalk.yellow('to restart at any time, enter `rs`'))
    }
    log(chalk.green(`starting 'node ${config.execute}'`))
    if (spawnedProcess != null) {
      spawnedProcess.kill('SIGINT')
    }
    spawnedProcess = childProcess.spawn(
      process.execPath,
      config.nodeArgs.concat([config.execute]).concat(config.programArgs),
      {
        stdio: 'inherit',
      },
    )
  }

  const debounceExecute = debounce(function () {
    try {
      execute()
    } catch (error) {
      logError(error)
    }
  }, config.executeDelay)

  await iterate({
    config,
    getOutputFilePath,
    async callback(sourceFile, outputFile, stats) {
      const cachedTimestamp = await timestampCache.get(getSha1(sourceFile)).value()
      if (cachedTimestamp === stats.mtime.getTime()) {
        if (!config.execute) {
          log(path.relative(config.rootDirectory, sourceFile), 'is unchanged')
        }
        return
      }
      transformationQueue.add(() => processFile(sourceFile, outputFile, stats)).catch(logError)
    },
  })

  if (!config.watch) {
    await transformationQueue.waitTillIdle()
    return
  }
  if (config.execute && process.stdin) {
    if (typeof process.stdin.unref === 'function') {
      process.stdin.unref()
    }
    process.stdin.on('data', function (chunk) {
      if (chunk.toString().trim() === 'rs') {
        debounceExecute()
      }
    })
  }

  const watcher = chokidar.watch(config.sourceDirectory, {
    ignored: config.ignored ? config.ignored : null,
    alwaysStat: true,
    ignoreInitial: true,
  })
  watcher.on('add', function (givenFileName: string, stats: fs.Stats) {
    const fileName = path.relative(config.sourceDirectory, givenFileName)
    const sourceFile = path.join(config.sourceDirectory, fileName)
    const outputFile = path.join(config.outputDirectory, fileName)
    transformationQueue
      .add(() => processFile(sourceFile, getOutputFilePath(outputFile), stats))
      .catch(logError)
      .then(() => {
        if (!config.ignoredForRestart || !anymatch(config.ignoredForRestart, posixifyPath(sourceFile))) {
          debounceExecute()
        }
      })
  })
  watcher.on('change', function (givenFileName: string, stats: fs.Stats) {
    const fileName = path.relative(config.sourceDirectory, givenFileName)
    const sourceFile = path.join(config.sourceDirectory, fileName)
    const outputFile = path.join(config.outputDirectory, fileName)
    transformationQueue
      .add(() => processFile(sourceFile, getOutputFilePath(outputFile), stats))
      .catch(logError)
      .then(() => {
        if (!config.ignoredForRestart || !anymatch(config.ignoredForRestart, posixifyPath(sourceFile))) {
          debounceExecute()
        }
      })
  })
  watcher.on('unlink', function (givenFileName: string) {
    const fileName = path.relative(config.sourceDirectory, givenFileName)
    const outputFile = path.join(config.outputDirectory, fileName)
    fs.promises.unlink(outputFile).catch(function () {
      /* No Op */
    })
  })

  await transformationQueue.waitTillIdle()
  debounceExecute()
}

export default main
