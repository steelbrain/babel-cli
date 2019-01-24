import del from 'del'
import fs from 'sb-fs'
import path from 'path'
import pMap from 'p-map'
import makeDir from 'make-dir'
import anymatch from 'anymatch'

async function iterate({
  extensions,
  rootDirectory,
  sourceDirectory,
  outputDirectory,
  ignored,
  keepExtraFiles,
  filesToKeep,
  callback,
}) {
  const contents = await fs.readdir(sourceDirectory)

  let outputStats
  let outputDirectoryExists = false
  try {
    outputStats = await fs.stat(outputDirectory)
  } catch (_) {
    /* No Op */
  }
  if (outputStats) {
    if (outputStats.isDirectory()) {
      outputDirectoryExists = true
    } else {
      await del(outputDirectory)
      outputStats = null
    }
  }

  const outputContents = outputStats ? await fs.readdir(outputDirectory) : []

  if (!keepExtraFiles) {
    const whitelist = filesToKeep(contents)
    const filesToDelete = outputContents
      .filter(item => !whitelist.includes(item))
      .map(item => path.resolve(outputDirectory, item))
    await Promise.all(filesToDelete.map(item => del(item)))
  }
  await pMap(contents, async function(fileName) {
    const filePath = path.join(sourceDirectory, fileName)
    const stat = await fs.lstat(filePath)
    if (stat.isSymbolicLink()) {
      // NOTE: We ignore symlinks
      return
    }
    if (
      anymatch(ignored, fileName) ||
      anymatch(ignored, filePath) ||
      anymatch(ignored, path.relative(rootDirectory, filePath))
    ) {
      // NOTE: We ignore ignored files
      return
    }
    if (stat.isFile()) {
      if (!extensions.includes(path.extname(fileName))) return

      if (!outputDirectoryExists) {
        await makeDir(outputDirectory)
        outputDirectoryExists = true
      }
      await callback(filePath, path.join(outputDirectory, fileName), stat)
    } else if (stat.isDirectory()) {
      await iterate({
        rootDirectory,
        sourceDirectory: path.join(sourceDirectory, fileName),
        outputDirectory: path.join(outputDirectory, fileName),
        ignored,
        keepExtraFiles,
        filesToKeep,
        callback,
      })
    }
  })
}

export default iterate
