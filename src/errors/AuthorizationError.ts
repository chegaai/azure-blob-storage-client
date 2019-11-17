export class AuthorizationError extends Error {
  constructor () {
    super(`the blob service is not authorized with the current credentials`)
  }
}
