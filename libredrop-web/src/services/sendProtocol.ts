
export function sendFile(file: File, dataChannel: RTCDataChannel) {
  dataChannel.send(createFileStartMessage(file.name, file.type))
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
  filename: string,
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

export function createFileStartMessage(filename: string, fileType: string): ArrayBuffer {
  const buf = new ArrayBuffer(1 + (filename.length + 1) + (fileType.length + 1))
  const view = new DataView(buf)
  const encoder = new TextEncoder()

  view.setUint8(0, 0);

  let filenameBytes = encoder.encode(filename)
  for (var i = 0; i < filename.length; i++) {
    view.setUint8(1 + i, filenameBytes[i])
  }
  view.setUint8(1 + filename.length, 0);

  let fileTypeBytes = encoder.encode(fileType)
  for (var i = 0; i < fileType.length; i++) {
    view.setUint8(1 + filename.length + 1 + i, fileTypeBytes[i])
  }
  view.setUint8(2 + filename.length + fileType.length, 0);

  return buf
}

export function parseFileStartMessage(buf: ArrayBuffer): FileStartMessage {
  const view = new DataView(buf)
  let index = 1; //skip message type byte

  const name = parseNullTerminatedString(view, index)
  index += name.length + 1
  const type = parseNullTerminatedString(view, index)

  return {
    messageNumber: view.getUint8(0),
    filename: name,
    fileType: type
  }
}

export function createFileDataMessage(chunkSize: number, chunk: ArrayBuffer) {
  const buf = new ArrayBuffer(4 + chunk.byteLength)
  const view = new DataView(buf)
  const chunkView = new DataView(chunk)

  view.setUint8(0, 1)
  view.setUint32(1, chunkSize)

  for (var i = 0; i < chunk.byteLength; i++) {
    view.setUint8(5 + i, chunkView.getUint8(i))
  }
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
