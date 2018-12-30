import FS from 'sb-fs'
import Path from 'path'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'
import promisify from 'sb-promisify'
import pMapSeries from 'p-map-series'
import anymatch from 'anymatch'

const rimrafAsync = promisify(rimraf)
const mkdirpAsync = promisify(mkdirp)

async function iterate({
  rootDirectory,
  sourceDirectory,
  outputDirectory,
  ignored,
  keepExtraFiles,
  filesToKeep,
  callback,
}) {
  const contents = await FS.readdir(sourceDirectory)

  let outputStats
  let outputDirectoryExists = false
  try {
    outputStats = await FS.stat(outputDirectory)
  } catch (_) {
    /* No Op */
  }
  if (outputStats && !outputStats.isDirectory()) {
    await rimrafAsync(outputDirectory)
    outputStats = null
  }
  if (outputStats && outputStats.isDirectory()) {
    outputDirectoryExists = true
  }
  const outputContents = outputStats ? await FS.readdir(outputDirectory) : []

  if (!keepExtraFiles) {
    const whitelist = filesToKeep(contents)
    const filesToDelete = outputContents
      .filter(item => !whitelist.includes(item))
      .map(item => Path.resolve(outputDirectory, item))
    await pMapSeries(filesToDelete, item => rimrafAsync(item))
  }
  await pMapSeries(contents, async function(fileName) {
    const filePath = Path.join(sourceDirectory, fileName)
    const stat = await FS.lstat(filePath)
    if (stat.isSymbolicLink()) {
      // NOTE: We ignore symlinks
      return
    }
    if (
      anymatch(ignored, fileName) ||
      anymatch(ignored, filePath) ||
      anymatch(ignored, Path.relative(rootDirectory, filePath))
    ) {
      // NOTE: We ignore ignored files
      return
    }
    if (stat.isFile()) {
      if (!fileName.endsWith('.js')) return
      if (!outputDirectoryExists) {
        await mkdirpAsync(outputDirectory)
        outputDirectoryExists = true
      }
      await callback(filePath, Path.join(outputDirectory, fileName), stat)
    } else if (stat.isDirectory()) {
      await iterate({
        rootDirectory,
        sourceDirectory: Path.join(sourceDirectory, fileName),
        outputDirectory: Path.join(outputDirectory, fileName),
        ignored,
        keepExtraFiles,
        filesToKeep,
        callback,
      })
    }
  })
}

export default iterate
