// @flow

import os from 'os'
import FS from 'sb-fs'
import Path from 'path'
import crypto from 'crypto'
import chokidar from 'chokidar'
import mkdirp from 'mkdirp'
import promisify from 'sb-promisify'
import getConfigFile from 'sb-config-file'
import resolveFrom from 'resolve-from'

import CLIError from './CLIError'
import handleError from './handleError'
import iterate from './iterate'
import type { Config } from './types'

const mkdirpAsync = promisify(mkdirp)

function getSha1(contents: string): string {
  const hash = crypto.createHash('sha1')
  hash.update(contents)
  return hash.digest('hex')
}

export default (async function doTheMagic(config: Config) {
  let transformFileCached
  let writingQueue = Promise.resolve()
  function getTransformFile() {
    if (!transformFileCached) {
      let resolved
      try {
        resolved = resolveFrom(config.sourceDirectory, 'babel-core')
      } catch (_) {
        /* No Op */
      }
      if (!resolved) {
        throw new CLIError('Unable to find babel-core in your project')
      }
      // $FlowIgnore: SORRY FLOW!
      const babelCore = require(resolved) // eslint-disable-line global-require,import/no-dynamic-require
      transformFileCached = promisify(babelCore.transformFile)
    }
    return transformFileCached
  }
  async function processFile(sourceFile, outputFile, stats, configFile) {
    if (!sourceFile.endsWith('.js')) return

    const transformed = await getTransformFile()(sourceFile)
    await FS.writeFile(outputFile, transformed.code, {
      mode: stats.mode,
    })
    console.log(sourceFile, '->', outputFile)
    if (config.writeFlowSources) {
      try {
        const flowOutputFile = `${outputFile}.flow`
        await FS.unlink(flowOutputFile)
        await FS.symlink(Path.resolve(sourceFile), flowOutputFile)
        console.log(sourceFile, '->', flowOutputFile)
      } catch (error) {
        /* No Op */
      }
    }
    writingQueue = writingQueue.then(() =>
      configFile.set(getSha1(sourceFile), stats.mtime.getTime()),
    )
    await writingQueue
  }
  async function getCacheFile() {
    const configDirectory = Path.join(os.homedir(), '.sb-babel-cli')
    await mkdirpAsync(configDirectory)
    const configFilePath = Path.join(
      configDirectory,
      `cache-timestamps-${getSha1(config.sourceDirectory)}`,
    )
    return getConfigFile(configFilePath)
  }

  const configFile = await getCacheFile()
  await iterate({
    rootDirectory: config.sourceDirectory,
    sourceDirectory: config.sourceDirectory,
    outputDirectory: config.outputDirectory,
    ignored: config.ignored,
    keepExtraFiles: config.keepExtraFiles,
    filesToKeep: input => input.concat(config.writeFlowSources ? input.map(i => `${i}.flow`) : []),
    async callback(sourceFile, outputFile, stats) {
      if (
        !config.disableCache &&
        (await configFile.get(getSha1(sourceFile))) === stats.mtime.getTime()
      ) {
        console.log(sourceFile, 'is unchanged')
        return
      }
      await processFile(sourceFile, outputFile, stats, configFile)
    },
  })

  await writingQueue
  if (!config.watch) return

  const resolvedSourceDirectory = Path.resolve(config.sourceDirectory)
  const watcher = chokidar.watch(resolvedSourceDirectory, {
    ignored: config.ignored,
    alwaysStat: true,
    ignoreInitial: true,
  })
  watcher.on('add', function(givenFileName, stats) {
    const fileName = Path.relative(resolvedSourceDirectory, givenFileName)
    const sourceFile = Path.join(config.sourceDirectory, fileName)
    const outputFile = Path.join(config.outputDirectory, fileName)
    mkdirpAsync(Path.dirname(outputFile))
      .then(() => processFile(sourceFile, outputFile, stats, configFile))
      .catch(handleError)
  })
  watcher.on('change', function(givenFileName, stats) {
    const fileName = Path.relative(resolvedSourceDirectory, givenFileName)
    const sourceFile = Path.join(config.sourceDirectory, fileName)
    const outputFile = Path.join(config.outputDirectory, fileName)
    mkdirpAsync(Path.dirname(outputFile))
      .then(() => processFile(sourceFile, outputFile, stats, configFile))
      .catch(handleError)
  })
  watcher.on('unlink', function(givenFileName) {
    const fileName = Path.relative(resolvedSourceDirectory, givenFileName)
    const outputFile = Path.join(config.outputDirectory, fileName)
    FS.unlink(outputFile).catch(function() {
      /* No Op */
    })
  })
})
