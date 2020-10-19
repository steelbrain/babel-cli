export interface Config {
  // INTERNAL arg:
  specifiedArgs: string[]
  sourceDirectory: string
  outputDirectory: string
  // READONLY arg:
  rootDirectory: string

  watch: boolean
  ignored: string
  ignoredForRestart: string
  sourceMaps: boolean | 'inline'
  resetCache: boolean
  keepExtraFiles: boolean
  execute: string
  executeDelay: number
  extensions: string[]
  // READONLY arg:
  loadConfig: boolean
  printConfig: boolean
  nodeArgs: string[]
  programArgs: string[]
}
