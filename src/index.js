import os from 'os'
import path from 'path'
import fs from 'sb-fs'
import chalk from 'chalk'
import PQueue from 'p-queue'
import makeDir from 'make-dir'
import chokidar from 'chokidar'
import anymatch from 'anymatch'
import debounce from 'lodash/debounce'
import childProcess from 'child_process'

import manifest from '../package.json'
import iterate from './iterate'
import { getSha1, getCacheDB, getBabelTransformFile, logError } from './helpers'

async function main(config) {
  let spawnedProcess
  const resolvedSourceDirectory = path.resolve(config.root, config.sourceDirectory)

  const extensions = config.typescript ? ['.ts', '.tsx', '.js'] : ['.js']
  const timestampCache = await getCacheDB(resolvedSourceDirectory, !config.disableCache)
  const babelTransformFile = getBabelTransformFile(resolvedSourceDirectory)
  const transformationQueue = new PQueue({ concurrency: os.cpus().length })
  const getOutputFilePath = filePath => {
    const extName = path.extname(filePath)
    if (extName.length) {
      return `${filePath.slice(0, -1 * path.extname(filePath).length)}.js`
    }
    return filePath
  }

  function log(...items) {
    if (config.execute) {
      console.log(`${chalk.yellow('[sb-babel-cli]')}`, ...items)
    } else {
      console.log(...items)
    }
  }

  async function processFile(sourceFile, outputFile, stats) {
    if (!extensions.includes(path.extname(sourceFile))) return

    const transformed = await babelTransformFile(sourceFile, {
      root: config.root,
      sourceMaps: config.sourceMaps === 'inline' ? 'inline' : config.sourceMaps,
    })
    await makeDir(path.dirname(outputFile))

    const mapFile = `${outputFile}.map`

    await Promise.all([
      fs.writeFile(
        outputFile,
        config.sourceMaps && config.sourceMaps !== 'inline'
          ? `${transformed.code}\n\n//# sourceMappingURL=${path.basename(mapFile)}`
          : transformed.code,
        {
          mode: stats.mode,
        },
      ),
      // Write source maps if option is given.
      config.sourceMaps && config.sourceMaps !== 'inline'
        ? fs.writeFile(mapFile, JSON.stringify(transformed.map, null, 2))
        : null,
    ])
    log(sourceFile, '->', outputFile)
    if (config.writeFlowSources) {
      const flowOutputFile = `${outputFile}.flow`
      try {
        await fs.unlink(flowOutputFile)
      } catch (_) {
        /* No Op */
      }
      try {
        await fs.symlink(path.resolve(sourceFile), flowOutputFile)
        log(sourceFile, '->', flowOutputFile)
      } catch (error) {
        /* No Op */
      }
    }
    timestampCache.set(getSha1(sourceFile), stats.mtime.getTime()).write()
  }

  function execute() {
    if (!config.execute) return

    if (!spawnedProcess) {
      log(chalk.yellow(manifest.version))
      log(chalk.yellow('to restart at any time, enter `rs`'))
    }
    log(chalk.green(`starting 'node ${config.execute}'`))
    if (spawnedProcess) {
      spawnedProcess.kill('SIGHUP')
    }
    spawnedProcess = childProcess.spawn(
      process.execPath,
      config.nodeFlags.concat([config.execute]).concat(config.programFlags),
      {
        stdio: 'inherit',
      },
    )
  }

  const debounceExecute = debounce(function() {
    try {
      execute()
    } catch (error) {
      logError(error)
    }
  }, config.executeDelay)

  await iterate({
    extensions,
    getOutputFilePath,
    rootDirectory: config.sourceDirectory,
    sourceDirectory: config.sourceDirectory,
    outputDirectory: config.outputDirectory,
    ignored: config.ignored,
    keepExtraFiles: config.keepExtraFiles,
    filesToKeep: input =>
      input
        .concat(config.writeFlowSources ? input.map(i => `${i}.flow`) : [])
        .concat(config.sourceMaps ? input.map(i => `${i}.map`) : []),
    async callback(sourceFile, outputFile, stats) {
      const cachedTimestamp = await timestampCache.get(getSha1(sourceFile)).value()
      if (cachedTimestamp === stats.mtime.getTime()) {
        if (!config.execute) {
          log(sourceFile, 'is unchanged')
        }
        return
      }
      transformationQueue.add(() => processFile(sourceFile, outputFile, stats)).catch(logError)
    },
  })

  if (!config.watch) {
    await transformationQueue.onIdle()
    return
  }
  if (config.execute && process.stdin) {
    if (typeof process.stdin.unref === 'function') {
      process.stdin.unref()
    }
    process.stdin.on('data', function(chunk) {
      if (chunk.toString().trim() === 'rs') {
        debounceExecute()
      }
    })
  }

  const watcher = chokidar.watch(resolvedSourceDirectory, {
    ignored: config.ignored,
    alwaysStat: true,
    ignoreInitial: true,
  })
  watcher.on('add', function(givenFileName, stats) {
    const fileName = path.relative(resolvedSourceDirectory, givenFileName)
    const sourceFile = path.join(config.sourceDirectory, fileName)
    const outputFile = path.join(config.outputDirectory, fileName)
    transformationQueue
      .add(() => processFile(sourceFile, getOutputFilePath(outputFile), stats))
      .catch(logError)
      .then(() => {
        if (!config.ignoredForRestart || !anymatch(config.ignoredForRestart, sourceFile)) {
          debounceExecute()
        }
      })
  })
  watcher.on('change', function(givenFileName, stats) {
    const fileName = path.relative(resolvedSourceDirectory, givenFileName)
    const sourceFile = path.join(config.sourceDirectory, fileName)
    const outputFile = path.join(config.outputDirectory, fileName)
    transformationQueue
      .add(() => processFile(sourceFile, getOutputFilePath(outputFile), stats))
      .catch(logError)
      .then(() => {
        if (!config.ignoredForRestart || !anymatch(config.ignoredForRestart, sourceFile)) {
          debounceExecute()
        }
      })
  })
  watcher.on('unlink', function(givenFileName) {
    const fileName = path.relative(resolvedSourceDirectory, givenFileName)
    const outputFile = path.join(config.outputDirectory, fileName)
    fs.unlink(outputFile).catch(function() {
      /* No Op */
    })
  })

  await transformationQueue.onIdle()
  debounceExecute()
}

export default main
