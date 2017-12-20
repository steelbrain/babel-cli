// @flow

export type Config = {
  watch: boolean,
  ignored: Array<string>,
  disableCache: boolean,
  writeFlowSources: boolean,
  keepExtraFiles: boolean,
  sourceDirectory: string,
  outputDirectory: string,
}
