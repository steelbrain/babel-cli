export interface Config {
  sourceDirectory: string
  outputDirectory: string
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
  loadConfig: boolean
  printConfig: boolean
  nodeArgs: string[]
  programArgs: string[]
}
