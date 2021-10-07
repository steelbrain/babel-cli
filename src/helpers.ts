import fs from 'fs'
import low from 'lowdb'
import path from 'path'
import crypto from 'crypto'
import makeDir from 'make-dir'
import debounce from 'lodash/debounce'
import resolveFrom from 'resolve-from'
import AdapterFileAsync from 'lowdb/adapters/FileAsync'

import { Config } from './types'

export class CLIError extends Error {}

export function posixifyPath(filePath: string): string {
  return filePath.split(path.sep).join(path.posix.sep)
}

export function getSha1(contents: string | Buffer): string {
  const hash = crypto.createHash('sha1')
  hash.update(contents)
  return hash.digest('hex')
}

export async function getCacheDB(
  projectPath: string,
  loadState: boolean,
  cacheDirectory: string,
): Promise<low.LowdbAsync<Record<string, any>>> {
  const configPath = path.join(cacheDirectory, '.sb-babel-cli', `cache-timestamps-${getSha1(projectPath)}`)
  await makeDir(path.dirname(configPath))

  const adapter = new AdapterFileAsync(configPath, {
    serialize: JSON.stringify,
  })
  adapter.write = debounce(adapter.write, 1000) as any

  const db = await low(adapter)
  if (!loadState) {
    db.setState({})
  }
  return db
}

export function logError(error: Error): void {
  if (error instanceof CLIError) {
    console.error('ERROR', error.message)
  } else {
    console.error(error)
  }
}

let babelCore: typeof import('@babel/core')

export function getBabelCore(projectPath: string): typeof import('@babel/core') {
  if (babelCore == null) {
    let resolved: string | null = null
    try {
      resolved = resolveFrom(projectPath, '@babel/core')
    } catch (_) {
      /* No Op */
    }
    if (!resolved) {
      throw new CLIError('Unable to find @babel/core in your project')
    }
    // eslint-disable-next-line global-require,import/no-dynamic-require,@typescript-eslint/no-var-requires
    babelCore = require(resolved)
  }
  return babelCore
}

const EXCLUDED_CONFIG_KEYS: (keyof Config)[] = ['rootDirectory', 'sourceDirectory', 'loadConfig', 'specifiedArgs']
export function validateConfig(config: Config, sourceConfig: Config): string[] {
  const issues: string[] = []

  if (typeof config !== 'object' || config == null || Array.isArray(config)) {
    issues.push('Config root is malformed')
  } else {
    const validKeys = Object.keys(sourceConfig)

    EXCLUDED_CONFIG_KEYS.forEach((item) => {
      validKeys.splice(validKeys.indexOf(item), 1)
    })

    const receivedKeys = Object.keys(config)
    const extraKeys = receivedKeys.filter((item) => !validKeys.includes(item))
    if (extraKeys.length > 0) {
      issues.push(`Unknown config items: ${extraKeys.join(', ')}`)
    }

    if (config.watch != null && typeof config.watch !== 'boolean') {
      issues.push('config.watch must be a valid boolean')
    }
    if (
      config.ignored != null &&
      (!Array.isArray(config.ignored) || !config.ignored.every((item) => typeof item === 'string'))
    ) {
      issues.push('config.ignored must be a valid array of strings')
    }
    if (
      config.ignoredForRestart != null &&
      (!Array.isArray(config.ignoredForRestart) || !config.ignoredForRestart.every((item) => typeof item === 'string'))
    ) {
      issues.push('config.ignoredForRestart must be a valid array of strings')
    }
    if (config.sourceMaps != null && typeof config.sourceMaps !== 'boolean' && config.sourceMaps !== 'inline') {
      issues.push('config.sourceMaps must either be a boolean or "inline"')
    }
    if (config.resetCache != null && typeof config.resetCache !== 'boolean') {
      issues.push('config.resetCache must be a valid boolean')
    }
    if (config.keepExtraFiles != null && typeof config.keepExtraFiles !== 'boolean') {
      issues.push('config.keepExtraFiles must be a valid boolean')
    }
    if (config.execute != null && typeof config.execute !== 'string') {
      issues.push('config.execute must be a valid string')
    }
    if (config.executeDelay != null && typeof config.executeDelay !== 'number') {
      issues.push('config.executeDelay must be a valid number')
    }
    if (
      config.extensions != null &&
      (!Array.isArray(config.extensions) || !config.extensions.every((item) => typeof item === 'string'))
    ) {
      issues.push('config.extensions must be a valid array of strings')
    }
    if (config.printConfig != null && typeof config.printConfig !== 'boolean') {
      issues.push('config.printConfig must be a valid boolean')
    }
    if (
      config.nodeArgs != null &&
      (!Array.isArray(config.nodeArgs) || !config.nodeArgs.every((item) => typeof item === 'string'))
    ) {
      issues.push('config.nodeArgs must be a valid array of strings')
    }
    if (
      config.programArgs != null &&
      (!Array.isArray(config.programArgs) || !config.programArgs.every((item) => typeof item === 'string'))
    ) {
      issues.push('config.programArgs must be a valid array of strings')
    }
  }

  return issues
}

export async function loadConfigFromRoot(rootDirectory: string, config: Config): Promise<Config> {
  const manifestPath = path.join(rootDirectory, 'package.json')
  try {
    await fs.promises.access(manifestPath, fs.constants.R_OK)
  } catch (_) {
    // Manifest does not exist
    return config
  }
  let parsed: Record<string, any> = {}
  try {
    parsed = JSON.parse(await fs.promises.readFile(manifestPath, 'utf8'))
  } catch (_) {
    // Manifest is not a valid JSON
    console.warn(`WARNING: Manifest file at ${manifestPath} is malformed`)
    return config
  }
  if (typeof parsed !== 'object' || parsed == null) {
    // Malformed manifest structure
    return config
  }

  const manifestConfig = parsed['sb-babel-cli']
  if (manifestConfig != null) {
    const issues = validateConfig(manifestConfig, config)
    if (issues.length > 0) {
      console.warn(`WARNING: Malformed sb-babel-cli config in manifest at ${manifestPath}`)
      console.log(issues.map((item) => `  - ${item}`).join('\n'))
      return config
    }
    const newConfig = { ...manifestConfig }
    Object.keys(config).forEach((key: keyof Config) => {
      if (config.specifiedArgs.includes(key) || EXCLUDED_CONFIG_KEYS.includes(key) || !(key in newConfig)) {
        newConfig[key] = config[key]
      }
    })
    return newConfig
  }

  return config
}
