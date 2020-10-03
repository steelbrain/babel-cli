import os from 'os'
import low from 'lowdb'
import pify from 'pify'
import path from 'path'
import crypto from 'crypto'
import makeDir from 'make-dir'
import debounce from 'lodash/debounce'
import resolveFrom from 'resolve-from'
import AdapterFileAsync from 'lowdb/adapters/FileAsync'

export const SUPPORTED_FLAGS = [
  '--debug-port',
  '--inspect-port',
  '--inspect',
  '--inspect-brk',
  '--inspect-publish-uid',
  '--enable-source-maps',
]
export class CLIError extends Error {}

export function getSha1(contents) {
  const hash = crypto.createHash('sha1')
  hash.update(contents)
  return hash.digest('hex')
}

export async function getCacheDB(projectPath, loadState) {
  const configPath = path.join(
    os.homedir(),
    '.sb-babel-cli',
    `cache-timestamps-${getSha1(projectPath)}`,
  )
  await makeDir(path.dirname(configPath))

  const adapter = new AdapterFileAsync(configPath, {
    serialize: JSON.stringify,
  })
  adapter.write = debounce(adapter.write, 1000)

  const db = await low(adapter)
  if (!loadState) {
    await db.setState({})
  }
  return db
}

export function logError(error) {
  if (error instanceof CLIError) {
    console.error('ERROR', error.message)
  } else {
    console.error(error)
  }
}

let transformFileCached
export function getBabelTransformFile(projectPath) {
  if (!transformFileCached) {
    let resolved
    try {
      resolved = resolveFrom(projectPath, '@babel/core')
    } catch (_) {
      /* No Op */
    }
    if (!resolved) {
      throw new CLIError('Unable to find @babel/core in your project')
    }
    // eslint-disable-next-line global-require,import/no-dynamic-require,@typescript-eslint/no-var-requires
    const babelCore = require(resolved)
    transformFileCached = pify(babelCore.transformFile)
  }
  return transformFileCached
}
