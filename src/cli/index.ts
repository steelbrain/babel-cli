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
  .option('--extensions <exts>', 'Comma spearated extensions to process through the CLI (defaults to .js)', (value) =>
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

const specifiedArgs: string[] = []
function optionalGet<T>(obj: Record<string, any>, key: string, defaultValue: T): T {
  if (obj[key] == null) {
    return defaultValue
  }
  specifiedArgs.push(key)
  return obj[key]
}

const configPartial: Omit<Config, 'specifiedArgs'> = {
  sourceDirectory: program.args[0],
  outputDirectory: optionalGet(program, 'outputDirectory', ''),
  rootDirectory: optionalGet(program, 'root', process.cwd()),

  watch: optionalGet(program, 'watch', false),
  ignored: optionalGet(program, 'ignored', ''),
  ignoredForRestart: optionalGet(program, 'ignoredForRestart', ''),
  sourceMaps: optionalGet(program, 'sourceMaps', false),
  resetCache: optionalGet(program, 'resetCache', false),
  keepExtraFiles: optionalGet(program, 'keepExtraFiles', false),
  execute: optionalGet(program, 'execute', ''),
  executeDelay: optionalGet(program, 'executeDelay', 250),
  extensions: optionalGet(program, 'extensions', ['.js']),
  loadConfig: optionalGet(program, 'loadConfig', true),
  printConfig: optionalGet(program, 'printConfig', false),
  nodeArgs,
  programArgs: program.args.slice(1),
}

main({
  ...configPartial,
  specifiedArgs,
}).catch((error) => {
  logError(error)
  process.exit(1)
})
