import os from 'os'
import path from 'path'
import fs from 'sb-fs'
import chalk from 'chalk'
import PQueue from 'p-queue'
import makeDir from 'make-dir'
import chokidar from 'chokidar'
import debounce from 'lodash/debounce'
import childProcess from 'child_process'

import manifest from '../package.json'
import iterate from './iterate'
import { getSha1, getCacheDB, getBabelTransformFile, logError } from './helpers'

async function main(config) {
  let spawnedProcess

  const timestampCache = await getCacheDB(config.sourceDirectory, !config.disableCache)
  const babelTransformFile = getBabelTransformFile()
  const transformationQueue = new PQueue({ concurrency: os.cpus().length })

  function log(...items) {
    if (config.execute) {
      console.log(`${chalk.yellow('[sb-babel-cli]')}`, ...items)
    } else {
      console.log(...items)
    }
  }

  async function processFile(sourceFile, outputFile, stats) {
    if (!sourceFile.endsWith('.js')) return

    const transformed = await babelTransformFile(sourceFile, {
      root: config.root,
    })
    await makeDir(path.dirname(outputFile))
    await fs.writeFile(outputFile, transformed.code, {
      mode: stats.mode,
    })
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
      spawnedProcess.kill()
    }
    spawnedProcess = childProcess.spawn(process.execPath, [config.execute], {
      stdio: 'inherit',
    })
  }

  const debounceExecute = debounce(function() {
    try {
      execute()
    } catch (error) {
      logError(error)
    }
  }, config.executeDelay)

  await iterate({
    rootDirectory: config.sourceDirectory,
    sourceDirectory: config.sourceDirectory,
    outputDirectory: config.outputDirectory,
    ignored: config.ignored,
    keepExtraFiles: config.keepExtraFiles,
    filesToKeep: input => input.concat(config.writeFlowSources ? input.map(i => `${i}.flow`) : []),
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

  if (!config.watch) return
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

  const resolvedSourceDirectory = path.resolve(config.sourceDirectory)
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
      .add(() => processFile(sourceFile, outputFile, stats))
      .catch(logError)
      .then(debounceExecute)
  })
  watcher.on('change', function(givenFileName, stats) {
    const fileName = path.relative(resolvedSourceDirectory, givenFileName)
    const sourceFile = path.join(config.sourceDirectory, fileName)
    const outputFile = path.join(config.outputDirectory, fileName)
    transformationQueue
      .add(() => processFile(sourceFile, outputFile, stats))
      .catch(logError)
      .then(debounceExecute)
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
