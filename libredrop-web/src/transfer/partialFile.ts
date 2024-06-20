import type { FileDataMessage, FileStartMessage } from './messages'

export class PartialFile {
  name: string
  type: string
  size: number

  receivedChunks: FileDataMessage[]
  receivedBytes: number

  constructor(header: FileStartMessage) {
    this.name = header.fileName
    this.type = header.fileType
    this.size = header.fileSize
    this.receivedChunks = []
    this.receivedBytes = 0
  }

  addChunk(chunk: FileDataMessage) {
    this.receivedChunks.push(chunk)
    this.receivedBytes += chunk.chunkSize
  }

  isDone(): boolean {
    return this.receivedBytes == this.size
  }

  progress(): number {
    return this.receivedBytes / this.size
  }

  createFile(): File {
    const blob = new Blob(
      this.receivedChunks.sort((a, b) => a.chunkIndex - b.chunkIndex).map((c) => c.data)
    )
    const file = new File([blob], this.name, {
      type: this.type
    })
    return file
  }
}
