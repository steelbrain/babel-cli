#!/usr/bin/env node
// @flow

import program from 'commander'

import doTheMagic from '../'
import CLIError from '../CLIError'
import manifest from '../../package.json'

function get(obj, key, defaultValue): any {
  if (typeof obj[key] === 'undefined') {
    return defaultValue
  }
  return obj[key]
}

program
  .version(manifest.version)
  .description(manifest.description)
  .usage('[options] <source directory>')
  .option('-w, --watch', 'Watch files for changes')
  .option('--ignored <list>', 'Ignored files and directories that match the given globs', value =>
    value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean),
  )
  .option('--disable-cache', 'Force recompile all files ignoring cache')
  .option('--keep-extra-files', 'Do NOT delete extra files in the output directory')
  .option('-o, --output-directory <directory>', 'Output directory to write transpiled files to')
  .parse(process.argv)

if (program.args.length !== 1) {
  program.outputHelp()
  process.exit(1)
}
if (typeof program.outputDirectory === 'undefined') {
  console.log('ERROR: You must specify output directory')
  program.outputHelp()
  process.exit(1)
}

doTheMagic({
  watch: get(program, 'watch', false),
  ignored: get(program, 'ignored', []),
  disableCache: get(program, 'disableCache', false),
  keepExtraFiles: get(program, 'keepExtraFiles', false),
  sourceDirectory: program.args[0],
  outputDirectory: program.outputDirectory,
}).catch(error => {
  if (error instanceof CLIError) {
    console.error(error.message)
  } else {
    console.error(error)
  }
  process.exit(1)
})
