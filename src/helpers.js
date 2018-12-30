
import low from 'lowdb'
import crypto from 'crypto'

export function getSha1(contents) {
  const hash = crypto.createHash('sha1')
  hash.update(contents)
  return hash.digest('hex')
}

export function getCacheFile(projectPath) {

}
