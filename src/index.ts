import { ObjectId } from 'bson'
import { ServiceError } from './errors/ServiceError'
import { EmptyAccessKeyError } from './errors/EmptyAcessKeyError'
import { AuthorizationError } from './errors/AuthorizationError'
import { UnresponsiveServiceError } from './errors/UnresponsiveServiceError'

import {
  Models,
  Aborter,
  ServiceURL,
  StorageURL,
  ContainerURL,
  BlockBlobURL,
  SharedKeyCredential,
} from '@azure/storage-blob'

export abstract class AzureBlobStorageClient {
  private containerURL: ContainerURL
  private serviceURL: ServiceURL
  private  aborter: Aborter

  constructor (accountAccessKey:string, accountName: string, containerName:string, timeOut:number) {
    if(!accountAccessKey)
      throw new EmptyAccessKeyError()
    this.aborter = Aborter.timeout(timeOut);
    const credentials = new SharedKeyCredential(accountName, accountAccessKey);
    const pipeline = StorageURL.newPipeline(credentials);
    this.serviceURL = new ServiceURL(`https://${accountName}.blob.core.windows.net`, pipeline);
    this.containerURL = ContainerURL.fromServiceURL(this.serviceURL, containerName);
  }

  async upload(text:string) {
    const fileName =`${new ObjectId().toHexString()}`
    let blockBlobURL: BlockBlobURL
    try{
      blockBlobURL = BlockBlobURL.fromContainerURL(this.containerURL, fileName);
      await blockBlobURL.upload(this.aborter, text, text.length);
    }catch(error){
      if (!error.response) throw new UnresponsiveServiceError(`${this.containerURL.url}/${fileName}`)
      if (error.response.status === 403) throw new AuthorizationError()
      if (error.response.status === 404) return null
      throw new ServiceError(error.response)
    }

    return blockBlobURL.url
  }

  async download(fileName: string) {
    let downloadResponse: Models.BlobDownloadResponse

    try{
      const blockBlobURL = BlockBlobURL.fromContainerURL(this.containerURL, fileName)
      downloadResponse = await blockBlobURL.download(this.aborter, 0)
    }catch(error){
      if (!error.response) throw new UnresponsiveServiceError(`${this.containerURL.url}/${fileName}`)
      if (error.response.status === 403) throw new AuthorizationError()
      if (error.response.status === 404) return null

      throw new ServiceError(error.response)
    }

    
    return new Promise((resolve, reject) => {
      const chunks: string[] = []
      const readableStream = downloadResponse.readableStreamBody as NodeJS.ReadableStream
      
      readableStream.on('data', data => {
        chunks.push(data.toString());
      });
      readableStream.on('end', () => {
        resolve(chunks.join(''));
      });
      readableStream.on('error', reject);
    });
  }
}

