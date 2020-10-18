#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import get from 'lodash/get'
import program from 'commander'

import main from '..'
import { Config } from '../types'
import { logError } from '../helpers'

const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'))

const NODE_ARGS: [string, string, boolean][] = [
  ['debug-port', 'debugPort', true],
  ['inspect-port', 'inspectPort', true],
  ['inspect', 'inspect', false],
  ['inspect-brk', 'inspectBrk', false],
  ['inspect-publish-uid', 'inspectPublishUid', true],
  ['enable-source-maps', 'enableSourceMaps', false],
]

program
  .version(manifest.version)
  .description(manifest.description)
  .usage('[options] <source directory>')
  .option('-w, --watch', 'Watch files for changes')
  .option(
    '--root <directory>',
    'Root directory for compilation; where presets and CLI config is resolved from (defaults to cwd)',
  )
  .option('--ignored <glob>', 'Ignored files and directories that match the given glob')
  .option('--ignored-for-restart <glob>', 'These files are transpiled, but do not cause restart')
  .option('--source-maps [true|false|inline]', 'Generate source maps for transpiled files', (value) =>
    value !== 'inline' ? value === 'true' : 'inline',
  )
  .option('--reset-cache', 'Retranspile all files ignoring cache')
  .option('--keep-extra-files', 'Do NOT delete extra files in the output directory')
  .option('-o, --output-directory <directory>', 'Output directory to write transpiled files to')
  .option('-x, --execute <entryFile>', 'Relative path of file to execute (only supported in watcher mode)')
  .option(
    '--execute-delay <delay>',
    'Delay in ms in between restarts of executed file (defaults to 1000ms)',
    (value) => parseInt(value, 10) || 1000,
  )
  .option(
    '-e <exts>, --extensions <exts>',
    'Comma spearated extensions to process through the CLI (defaults to .js)',
    (value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
  )
  .option('--no-load-config', 'Disables loading of "sb-config-file" from package.json (in --root)')
  .option('--print-config', 'Print the config being used (for debugging only)')
  .on('--help', () => {
    console.log('\nArguments after -- will be passed as-are to programs executed through -x')
  })
  .combineFlagAndOptionalValue(true)

NODE_ARGS.forEach(([nodeArg, , hasOption]) => {
  console.log(nodeArg, hasOption)
  program.option(
    `--${nodeArg}${hasOption ? ' <arg>' : ''}`,
    'Passthrough arg for Node.js runtime for programs executed through -x',
  )
})

program.parse(process.argv)

if (program.args.length < 1) {
  program.outputHelp()
  process.exit(1)
}

const nodeArgs = NODE_ARGS.filter((item) => program[item[1]] != null)
  .map((item) => (item[2] ? [`--${item[0]}`, program[item[1]]] : [`--${item[0]}`]))
  .flat()

const config: Config = {
  sourceDirectory: program.args[0],
  outputDirectory: program.outputDirectory,
  rootDirectory: get(program, 'root', process.cwd()),

  watch: get(program, 'watch', false),
  ignored: get(program, 'ignored', ''),
  ignoredForRestart: get(program, 'ignoredForRestart', null),
  sourceMaps: get(program, 'sourceMaps', false),
  resetCache: get(program, 'resetCache', false),
  keepExtraFiles: get(program, 'keepExtraFiles', false),
  execute: get(program, 'execute', ''),
  executeDelay: get(program, 'executeDelay', 250),
  extensions: get(program, 'extensions', ['.js']),
  loadConfig: get(program, 'loadConfig', true),
  printConfig: get(program, 'printConfig', false),
  nodeArgs,
  programArgs: program.args.slice(1),
}

if (!config.watch && config.execute) {
  console.error('ERROR: --execute is not supported without --watch')
  process.exit(1)
}

main(config).catch((error) => {
  logError(error)
  process.exit(1)
})
