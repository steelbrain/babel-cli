#!/usr/bin/env node

import get from 'lodash/get'
import program from 'commander'

import main from '..'
import { logError, SUPPORTED_FLAGS } from '../helpers'
import manifest from '../../package.json'

program
  .version(manifest.version)
  .description(manifest.description)
  .usage('[options] <source directory>')
  .option('-w, --watch', 'Watch files for changes')
  .option('--root <directory>', 'Root directory for babel. This is where presets are resolved from')
  .option('--ignored <glob>', 'Ignored files and directories that match the given glob')
  .option('--ignored-for-restart <glob>', 'These files are transpiled, but do not cause restart')
  .option('--source-maps [true|false|inline]', 'Generate source maps for transpiled files')
  .option('--reset-cache', 'Retranspile all files ignoring cache')
  .option('--keep-extra-files', 'Do NOT delete extra files in the output directory')
  .option('-o, --output-directory <directory>', 'Output directory to write transpiled files to')
  .option(
    '-x, --execute <entryFile>',
    'Relative path of file to execute (only supported in watcher mode)',
  )
  .option(
    '--execute-delay <delay>',
    'Delay in ms to in between restarts of executed file (defaults to 1000ms)',
    (value) => parseInt(value, 10) || 1000,
  )
  .option('--typescript', 'Enables typescript support by processing .ts and .tsx files')
  .on('--help', () => {
    console.log('\nArguments after -- will be passed as-are to the program specified in -x flag')
    console.log('Supported NodeJS CLI flags: ', SUPPORTED_FLAGS.join(', '))
  })
  .parse(process.argv)

if (program.args.length < 1) {
  program.outputHelp()
  process.exit(1)
}
if (typeof program.outputDirectory === 'undefined') {
  console.log('ERROR: You must specify output directory')
  program.outputHelp()
  process.exit(1)
}

const nodeFlags = []
SUPPORTED_FLAGS.forEach((item) => {
  const flagIndex = program.rawArgs.indexOf(item)
  if (flagIndex !== -1) {
    let flagValue = program.rawArgs[flagIndex + 1] || true
    if (
      typeof flagValue === 'undefined' ||
      (typeof flagValue === 'string' &&
        (flagValue.startsWith('-') || program.args.includes(flagValue)))
    ) {
      // ^ If it's got no value, or value is an option or value is present in args
      // Then the value must not be own, so treat this as a boolean
      flagValue = true
    }
    nodeFlags.push(item)
    if (flagValue !== true) {
      // ^ True values are unnecessary to specify
      nodeFlags.push(flagValue)
    }
  }
})

const config = {
  root: get(program, 'root', process.cwd()),
  watch: get(program, 'watch', false),
  ignored: get(program, 'ignored', ''),
  ignoredForRestart: get(program, 'ignoredForRestart', null),
  resetCache: get(program, 'resetCache', false),
  keepExtraFiles: get(program, 'keepExtraFiles', false),
  sourceMaps: get(program, 'sourceMaps', false),
  sourceDirectory: program.args[0],
  outputDirectory: program.outputDirectory,
  typescript: program.typescript,

  nodeFlags,
  programFlags: program.args.slice(1),

  execute: get(program, 'execute', ''),
  executeDelay: get(program, 'executeDelay', 250),
}

if (config.sourceMaps !== 'inline' && typeof config.sourceMaps === 'string') {
  config.sourceMaps = config.sourceMaps === 'true'
}

if (!config.watch && config.execute) {
  console.error('ERROR: --execute is not supported without --watch')
  process.exit(1)
}

main(config).catch((error) => {
  logError(error)
  process.exit(1)
})
