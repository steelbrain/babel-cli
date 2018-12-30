import os from 'os'
import low from 'lowdb'
import path from 'path'
import crypto from 'crypto'
import debounce from 'lodash/debounce'
import promisify from 'sb-promisify'
import resolveFrom from 'resolve-from'
import AdapterFileAsync from 'lowdb/adapters/FileAsync'

export class CLIError extends Error {}

export function getSha1(contents) {
  const hash = crypto.createHash('sha1')
  hash.update(contents)
  return hash.digest('hex')
}

export async function getCacheDB(projectPath, loadState) {
  const configPath = path.join(os.homedir(), '.sb-babel-cli', `timestamps-${getSha1(projectPath)}`)

  const adapter = new AdapterFileAsync(configPath, {
    serialize: JSON.stringify,
  })
  adapter.write = debounce(adapter.write, 1000)

  const db = low(adapter)
  if (loadState) {
    await db.read()
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
    // eslint-disable-next-line global-require,import/no-dynamic-require
    const babelCore = require(resolved)
    transformFileCached = promisify(babelCore.transformFile)
  }
  return transformFileCached
}
