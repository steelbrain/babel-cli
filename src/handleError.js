import CLIError from './CLIError'

export default function handleError(error) {
  if (error instanceof CLIError) {
    console.error('ERROR', error.message)
  } else {
    console.error(error)
  }
}
