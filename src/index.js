// @flow

import CLIError from './CLIError'
import iterate from './iterate'
import type { Config } from './types'

export default (async function doTheMagic(config: Config) {
  await iterate({
    rootDirectory: config.sourceDirectory,
    sourceDirectory: config.sourceDirectory,
    outputDirectory: config.outputDirectory,
    ignored: config.ignored,
    keepExtraFiles: config.keepExtraFiles,
    filesToKeep: input => input.concat(config.writeFlowSources ? input.map(i => `${i}.flow`) : []),
    async callback(filePath, outputDirectory) {
      console.log(filePath, outputDirectory)
    },
  })
})
