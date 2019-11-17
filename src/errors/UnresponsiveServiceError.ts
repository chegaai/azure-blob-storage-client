export class UnresponsiveServiceError extends Error {
  constructor (serviceName: string) {
    super(`Blob ${serviceName} is unresponsive`)
  }
}
