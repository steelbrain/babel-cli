// @flow

export type Config = {
  root: string,
  watch: boolean,
  ignored: Array<string>,
  disableCache: boolean,
  writeFlowSources: boolean,
  keepExtraFiles: boolean,
  sourceDirectory: string,
  outputDirectory: string,

  execute: string,
  executeDelay: number,
}
