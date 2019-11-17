export class ServiceError extends Error {
  constructor (response: any) {
    super(response)
  }
}
