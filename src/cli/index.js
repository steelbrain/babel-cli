#!/usr/bin/env node

import get from 'lodash/get'
import program from 'commander'

import main from '..'
import { logError } from '../helpers'
import manifest from '../../package.json'

program
  .version(manifest.version)
  .description(manifest.description)
  .usage('[options] <source directory>')
  .option('-w, --watch', 'Watch files for changes')
  .option('--root <directory>', 'Root directory for babel. This is where presets are resolved from')
  .option('--ignored <list>', 'Ignored files and directories that match the given globs', value =>
    value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean),
  )
  .option(
    '--write-flow-sources',
    'Write .flow files that are symlinked to source files. Helps with monorepos in some cases',
  )
  .option('--disable-cache', 'Force recompile all files ignoring cache')
  .option('--keep-extra-files', 'Do NOT delete extra files in the output directory')
  .option('-o, --output-directory <directory>', 'Output directory to write transpiled files to')
  .option(
    '-x, --execute <entryFile>',
    'Relative path of file to execute (only supported in watcher mode)',
  )
  .option(
    '--execute-delay <delay>',
    'Delay in ms to in between restarts of executed file (defaults to 1000ms)',
    value => parseInt(value, 10) || 1000,
  )
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

const config = {
  root: get(program, 'root', process.cwd()),
  watch: get(program, 'watch', false),
  ignored: get(program, 'ignored', []),
  disableCache: get(program, 'disableCache', false),
  writeFlowSources: get(program, 'writeFlowSources', false),
  keepExtraFiles: get(program, 'keepExtraFiles', false),
  sourceDirectory: program.args[0],
  outputDirectory: program.outputDirectory,

  execute: get(program, 'execute', ''),
  executeDelay: get(program, 'executeDelay', 250),
}

if (!config.watch && config.execute) {
  console.error('ERROR: --execute is not supported without --watch')
  process.exit(1)
}

main(config).catch(error => {
  logError(error)
  process.exit(1)
})
