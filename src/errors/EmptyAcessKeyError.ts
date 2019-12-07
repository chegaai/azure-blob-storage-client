export class EmptyAccessKeyError extends Error {
  constructor () {
    super(`The Azure blob Access key is empty`)
  }
}
