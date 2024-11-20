/*
Send Protocol Byte Format:

0: Message Type (byte) => 0 = Start File Header, 1 = File Data, 2 = End File Header, 3 = TransferStartMessage
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
  messageNumber: number //0
  fileName: string
  fileSize: number
  fileType: string
}

export type FileDataMessage = {
  messageNumber: number //1
  chunkIndex: number
  chunkSize: number
  data: ArrayBuffer
}

export type FileEndMessage = {
  messageNumber: number //2
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
  view.setUint8(1 + 4 + filename.length, 0) // null terminate

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
