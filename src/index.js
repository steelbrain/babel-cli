// @flow

import FS from 'sb-fs'
import promisify from 'sb-promisify'
import resolveFrom from 'resolve-from'

import CLIError from './CLIError'
import iterate from './iterate'
import type { Config } from './types'

export default (async function doTheMagic(config: Config) {
  let transformFileCached
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

  await iterate({
    rootDirectory: config.sourceDirectory,
    sourceDirectory: config.sourceDirectory,
    outputDirectory: config.outputDirectory,
    ignored: config.ignored,
    keepExtraFiles: config.keepExtraFiles,
    filesToKeep: input => input.concat(config.writeFlowSources ? input.map(i => `${i}.flow`) : []),
    async callback(sourceFile, outputFile) {
      const transformed = await getTransformFile()(sourceFile)
      await FS.writeFile(outputFile, transformed.code)
      console.log(sourceFile, '->', outputFile)
    },
  })
})
