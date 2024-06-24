import { createFileDataMessage, createFileEndMessage, createFileStartMessage } from './messages'

const CHUNK_SIZE = 16000

//TODO: Buffered sending (use queue + consumer (data channel)/producer (file reader))
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

        if (offset >= file.size) {
          console.log('FINISHED')
          dataChannel.send(createFileEndMessage())
          resolve(file.name)
        } else if (dataChannel.bufferedAmount < dataChannel.bufferedAmountLowThreshold) {
          readChunk(file, reader, offset)
        }

        progressCallback(offset / file.size)
        chunkIndex++
      }
    })

    dataChannel.addEventListener("bufferedamountlow", () => {
      if (offset < file.size)
        readChunk(file, reader, offset)
    })

    readChunk(file, reader, offset)
  })
}

function readChunk(file: File, reader: FileReader, offset: number) {
  const nextSlice = file.slice(offset, Math.min(offset + CHUNK_SIZE, file.size))
  reader.readAsArrayBuffer(nextSlice)
}
