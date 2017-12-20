// @flow

import FS from 'sb-fs'
import Path from 'path'
import pMap from 'p-map'
import rimraf from 'rimraf'
import promisify from 'sb-promisify'
import anymatch from 'anymatch'

const rimrafPromised = promisify(rimraf)

export default (async function iterate({
  sourceDirectory,
  outputDirectory,
  ignored,
  keepExtraFiles,
  filesToKeep,
  callback,
}: {
  sourceDirectory: string,
  outputDirectory: string,
  ignored: Array<string>,
  keepExtraFiles: boolean,
  filesToKeep: (sourceItems: Array<string>) => Array<string>,
  callback: any,
}): Promise<void> {
  if (!await FS.exists(outputDirectory)) {
    await FS.mkdirp(outputDirectory)
  }
  const contents = await FS.readdir(sourceDirectory)
  const outputContents = await FS.readdir(outputDirectory)
  if (!keepExtraFiles) {
    const whitelist = filesToKeep(contents)
    const filesToDelete = outputContents
      .filter(item => !whitelist.includes(item))
      .map(item => Path.resolve(outputDirectory, item))
    await pMap(filesToDelete, item => rimrafPromised(item))
  }
})
