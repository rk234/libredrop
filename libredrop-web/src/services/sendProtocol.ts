const CHUNK_SIZE = 16000;

export function sendFile(file: File, dataChannel: RTCDataChannel) {
  dataChannel.send(createFileStartMessage(file.name, file.size, file.type))

  const reader = new FileReader()
  let offset = 0

  reader.addEventListener("error", error => console.log("Error reading file! " + error))
  reader.addEventListener("abort", event => console.log("File read aborted! " + event))
  reader.addEventListener("load", event => {
    if (event.target?.result) {
      const buf = event.target.result as ArrayBuffer
      const message = createFileDataMessage(buf.byteLength, buf)
      offset += buf.byteLength

      dataChannel.send(message)

      if (offset < file.size) {
        readChunk(file, reader, offset)
      } else {
        console.log("FINISHED")
        dataChannel.send(createFileEndMessage())
      }
    }
  })

  readChunk(file, reader, offset)
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

type FileStartMessage = {
  messageNumber: number,
  fileName: string,
  fileSize: number,
  fileType: string
}

type FileDataMessage = {
  messageNumber: number,
  chunkSize: number
  data: ArrayBuffer
}

type FileEndMessage = {
  messageNumber: number
} //TODO

export function createFileStartMessage(filename: string, fileSize: number, fileType: string): ArrayBuffer {
  const buf = new ArrayBuffer(1 + 4 + (filename.length + 1) + (fileType.length + 1))
  const view = new DataView(buf)
  const encoder = new TextEncoder()

  view.setUint8(0, 0);
  view.setUint32(1, fileSize);

  let filenameBytes = encoder.encode(filename)
  for (var i = 0; i < filename.length; i++) {
    view.setUint8(1 + 4 + i, filenameBytes[i])
  }
  view.setUint8(1 + 4 + filename.length, 0);

  let fileTypeBytes = encoder.encode(fileType)
  for (var i = 0; i < fileType.length; i++) {
    view.setUint8(1 + 4 + filename.length + 1 + i, fileTypeBytes[i])
  }
  view.setUint8(2 + 4 + filename.length + fileType.length, 0);

  return buf
}

export function parseFileStartMessage(buf: ArrayBuffer): FileStartMessage {
  const view = new DataView(buf)
  let index = 1 + 4; //skip message type byte and size

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

export function createFileDataMessage(chunkSize: number, chunk: ArrayBuffer): ArrayBuffer {
  const buf = new ArrayBuffer(5 + chunk.byteLength)
  const view = new DataView(buf)
  const chunkView = new DataView(chunk)

  view.setUint8(0, 1)
  view.setUint32(1, chunkSize)

  for (var i = 0; i < chunk.byteLength; i++) {
    view.setUint8(5 + i, chunkView.getUint8(i))
  }
  return buf
}

export function parseFileDataMessage(buf: ArrayBuffer): FileDataMessage {
  const view = new DataView(buf)

  return {
    messageNumber: view.getUint8(0),
    chunkSize: view.getUint32(1),
    data: buf.slice(5)
  }
}

export function createFileEndMessage(): ArrayBuffer {
  const buf = new ArrayBuffer(1)
  const view = new DataView(buf)
  view.setUint8(0, 2)

  return buf
}

export function messageType(buf: ArrayBuffer): number {
  return new DataView(buf).getUint8(0);
}

export function parseFileEndMessage(buf: ArrayBuffer): FileEndMessage {
  return {
    messageNumber: messageType(buf)
  }
}

function parseNullTerminatedString(view: DataView, startIndex: number): string {
  let index = startIndex
  let bytes: number[] = []
  const decoder = new TextDecoder()

  while (view.getInt8(index) != 0) {
    bytes.push(view.getInt8(index))
    index++;
  }

  return decoder.decode(new Uint8Array(bytes))
}
