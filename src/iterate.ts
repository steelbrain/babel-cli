import fs from 'fs'
import del from 'del'
import path from 'path'
import pMap from 'p-map'
import makeDir from 'make-dir'
import anymatch from 'anymatch'

import { Config } from './types'
import { posixifyPath } from './helpers'

async function iterate({
  config,
  callback,
  getOutputFilePath,
}: {
  config: Config
  callback: (filePath: string, outputPath: string, stats: fs.Stats) => Promise<void>
  getOutputFilePath: (arg: string) => string
}): Promise<void> {
  const contents = await fs.promises.readdir(config.sourceDirectory)

  let outputStats: fs.Stats | null = null
  let outputDirectoryExists = false
  try {
    outputStats = await fs.promises.stat(config.outputDirectory)
  } catch (_) {
    /* No Op */
  }
  if (outputStats) {
    if (outputStats.isDirectory()) {
      outputDirectoryExists = true
    } else {
      await del(config.outputDirectory)
      outputStats = null
    }
  }

  const outputContents = outputStats ? await fs.promises.readdir(config.outputDirectory) : []

  if (!config.keepExtraFiles) {
    let whitelist = contents.map(getOutputFilePath)
    if (config.sourceMaps === true) {
      whitelist = whitelist.concat(whitelist.map((item) => `${item}.map`))
    }

    const filesToDelete = outputContents
      .filter((item) => !whitelist.includes(item))
      .map((item) => path.resolve(config.outputDirectory, item))
    await Promise.all(filesToDelete.map((item) => del(item)))
  }
  await pMap(contents, async function (itemName: string) {
    const filePath = path.join(config.sourceDirectory, itemName)
    const stat = await fs.promises.lstat(filePath)
    if (stat.isSymbolicLink()) {
      // NOTE: We ignore symlinks
      return
    }
    if (
      config.ignored &&
      (anymatch(config.ignored, itemName) ||
        anymatch(config.ignored, posixifyPath(filePath)) ||
        anymatch(config.ignored, posixifyPath(path.relative(config.rootDirectory, filePath))))
      // TODO: Convert above to posix
    ) {
      // NOTE: We ignore ignored files
      return
    }
    if (stat.isFile()) {
      const foundExt = config.extensions.find((ext) => itemName.endsWith(ext))

      if (!foundExt) {
        return
      }

      if (!outputDirectoryExists) {
        await makeDir(config.outputDirectory)
        outputDirectoryExists = true
      }
      const outputFile = getOutputFilePath(path.join(config.outputDirectory, itemName))
      await callback(filePath, outputFile, stat)
    } else if (stat.isDirectory()) {
      await iterate({
        config: {
          ...config,
          sourceDirectory: path.join(config.sourceDirectory, itemName),
        },
        getOutputFilePath,
        callback,
      })
    }
  })
}

export default iterate
