import { Aborter, BlockBlobURL, ContainerURL, ServiceURL, SharedKeyCredential, StorageURL } from '@azure/storage-blob'
import { ObjectId } from 'bson'
import { EmptyAccessKeyError } from './errors/EmptyAcessKeyError'


function streamToBuffer (stream: NodeJS.ReadableStream) {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []

    stream.on('data', data => {
      chunks.push(data)
    })

    stream.on('end', () => {
      resolve(Buffer.concat(chunks))
    })

    stream.on('error', reject)
  })
}

export abstract class AzureBlobStorageClient {
  private containerURL: ContainerURL
  private serviceURL: ServiceURL

  constructor (accountAccessKey: string, accountName: string, containerName: string) {
    if (!accountAccessKey) throw new EmptyAccessKeyError()
    const credentials = new SharedKeyCredential(accountName, accountAccessKey)
    const pipeline = StorageURL.newPipeline(credentials)
    this.serviceURL = new ServiceURL(`https://${accountName}.blob.core.windows.net`, pipeline)
    this.containerURL = ContainerURL.fromServiceURL(this.serviceURL, containerName)
  }

  async upload (content: Buffer, mimeType: string) {
    const fileName = `${new ObjectId().toHexString()}`

    const blockBlobURL = BlockBlobURL.fromContainerURL(this.containerURL, fileName)
    await blockBlobURL.upload(Aborter.none, content, content.byteLength, { blobHTTPHeaders: { blobContentType: mimeType } })
    return blockBlobURL.url
  }

  async uploadBase64 (base64: string, mimeType: string) {
    const content = Buffer.from(base64, 'base64')
    return this.upload(content, mimeType)
  }

  async download (fileName: string) {
    const blockBlobURL = BlockBlobURL.fromContainerURL(this.containerURL, fileName)
    const { readableStreamBody } = await blockBlobURL.download(Aborter.none, 0)
    return streamToBuffer(readableStreamBody!)
  }
}

