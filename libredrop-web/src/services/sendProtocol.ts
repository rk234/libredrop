const CHUNK_SIZE = 16000

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

export async function sendFile(
  file: File,
  dataChannel: RTCDataChannel,
  progressCallback: (prog: number) => void
) {
  return new Promise((resolve, _) => {
    dataChannel.send(createFileStartMessage(file.name, file.size, file.type))

    const reader = new FileReader()
    let offset = 0

    reader.addEventListener('error', (error) => console.log('Error reading file! ' + error))
    reader.addEventListener('abort', (event) => console.log('File read aborted! ' + event))
    let chunkIndex = 0
    reader.addEventListener('load', (event) => {
      if (event.target?.result) {
        const buf = event.target.result as ArrayBuffer
        const message = createFileDataMessage(buf.byteLength, chunkIndex, buf)
        offset += buf.byteLength

        dataChannel.send(message)

        if (offset < file.size) {
          readChunk(file, reader, offset)
        } else {
          console.log('FINISHED')
          dataChannel.send(createFileEndMessage())
          resolve(file.name)
        }
        progressCallback(offset / file.size)
        chunkIndex++
      }
    })

    readChunk(file, reader, offset)
  })
}

function readChunk(file: File, reader: FileReader, offset: number) {
  const nextSlice = file.slice(offset, Math.min(offset + CHUNK_SIZE, file.size))
  reader.readAsArrayBuffer(nextSlice)
}

/*
Send Protocol Byte Format:

0: Message Type (byte) => 0 = Start File Header, 1 = File Data, 2 = End File Header
======
File data:
1: Chunk Size in bytes
1-1+ChunkSize: File data
======
Start File Header
1: file name (null terminated string)
2: file extension: (terminated string)

======
*/
export type TransferStartMessage = {
  messageNumber: number //3
  numberOfFiles: number //Number of files to be sent
}

export type FileStartMessage = {
  messageNumber: number
  fileName: string
  fileSize: number
  fileType: string
}

export type FileDataMessage = {
  messageNumber: number
  chunkIndex: number
  chunkSize: number
  data: ArrayBuffer
}

export type FileEndMessage = {
  messageNumber: number
} //TODO

export function createTransferStartMessage(numberOfFiles: number) {
  const buf = new ArrayBuffer(1 + 4)
  const view = new DataView(buf)

  view.setUint8(0, 3)
  view.setUint32(1, numberOfFiles)

  return buf
}

export function parseTransferStartMessage(buf: ArrayBuffer): TransferStartMessage {
  const view = new DataView(buf)
  return {
    messageNumber: view.getUint8(0),
    numberOfFiles: view.getUint32(1)
  }
}

export function createFileStartMessage(
  filename: string,
  fileSize: number,
  fileType: string
): ArrayBuffer {
  const buf = new ArrayBuffer(1 + 4 + (filename.length + 1) + (fileType.length + 1))
  const view = new DataView(buf)
  const encoder = new TextEncoder()

  view.setUint8(0, 0)
  view.setUint32(1, fileSize)

  const filenameBytes = encoder.encode(filename)
  for (var i = 0; i < filename.length; i++) {
    view.setUint8(1 + 4 + i, filenameBytes[i])
  }
  view.setUint8(1 + 4 + filename.length, 0)

  const fileTypeBytes = encoder.encode(fileType)
  for (var i = 0; i < fileType.length; i++) {
    view.setUint8(1 + 4 + filename.length + 1 + i, fileTypeBytes[i])
  }
  view.setUint8(2 + 4 + filename.length + fileType.length, 0)

  return buf
}

export function parseFileStartMessage(buf: ArrayBuffer): FileStartMessage {
  const view = new DataView(buf)
  let index = 1 + 4 //skip message type byte and size

  const name = parseNullTerminatedString(view, index)
  index += name.length + 1
  const type = parseNullTerminatedString(view, index)

  return {
    messageNumber: view.getUint8(0),
    fileSize: view.getUint32(1),
    fileName: name,
    fileType: type
  }
}

export function createFileDataMessage(
  chunkSize: number,
  chunkIndex: number,
  chunk: ArrayBuffer
): ArrayBuffer {
  const buf = new ArrayBuffer(9 + chunk.byteLength)
  const view = new DataView(buf)
  const chunkView = new DataView(chunk)

  view.setUint8(0, 1) //1 byte
  view.setUint32(1, chunkSize) //4 bytes
  view.setUint32(5, chunkIndex) //4 bytes

  for (let i = 0; i < chunk.byteLength; i++) {
    view.setUint8(9 + i, chunkView.getUint8(i))
  }
  return buf
}

export function parseFileDataMessage(buf: ArrayBuffer): FileDataMessage {
  const view = new DataView(buf)

  return {
    messageNumber: view.getUint8(0),
    chunkSize: view.getUint32(1),
    chunkIndex: view.getUint32(5),
    data: buf.slice(9)
  }
}

export function createFileEndMessage(): ArrayBuffer {
  const buf = new ArrayBuffer(1)
  const view = new DataView(buf)
  view.setUint8(0, 2)

  return buf
}

export function messageType(buf: ArrayBuffer): number {
  return new DataView(buf).getUint8(0)
}

export function parseFileEndMessage(buf: ArrayBuffer): FileEndMessage {
  return {
    messageNumber: messageType(buf)
  }
}

function parseNullTerminatedString(view: DataView, startIndex: number): string {
  let index = startIndex
  const bytes: number[] = []
  const decoder = new TextDecoder()

  while (view.getInt8(index) != 0) {
    bytes.push(view.getInt8(index))
    index++
  }

  return decoder.decode(new Uint8Array(bytes))
}
