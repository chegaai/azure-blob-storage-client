export class AzureBlobClientError extends Error {
  constructor (public readonly originalError: any) {
    super('Received an error from the azure blob sdk. Check `originalError` property for details')
  }
}
