export function sendFile(file: File, dataChannel: RTCDataChannel) {
  const fileReader = new FileReader()

  dataChannel.send(createFileStartMessage(file.name, file.type))

  fileReader.addEventListener('error', (err) => console.log('ERROR: ', err))
  fileReader.addEventListener('abort', (err) => console.log('ABORT: ', err))
  fileReader.addEventListener('load', (evt) => {
    if (evt.target) {
      const fileData = evt.target.result as ArrayBuffer
      dataChannel.send(createFileDataMessage(fileData))
    }
  })
}

function createFileDataMessage(chunk: ArrayBuffer): ArrayBuffer {
  const buf = new ArrayBuffer(1 + 4 + chunk.byteLength)
  const view = new DataView(buf)
  // TODO

  return buf
}

function createFileStartMessage(filename: string, fileType: string): ArrayBuffer {
  // TODO
  return new ArrayBuffer(0)
}
