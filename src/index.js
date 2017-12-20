// @flow

import CLIError from './CLIError'
import type { Config } from './types'

export default (async function doTheMagic(config: Config) {
  console.log('config', config)
})
