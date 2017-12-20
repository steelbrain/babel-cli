// @flow

import CLIError from './CLIError'

export default function handleError(error: any) {
  if (error instanceof CLIError) {
    console.error('ERROR', error.message)
  } else {
    console.error(error)
  }
}
