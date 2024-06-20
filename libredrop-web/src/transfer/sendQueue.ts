import type { FileDataMessage } from './messages'

export default class SendQueue {
  queue: FileDataMessage[]

  constructor() {
    this.queue = []
  }

  offer(fdm: FileDataMessage) {
    this.queue.push(fdm)
  }

  poll(): FileDataMessage {
    return this.queue.shift()!!
  }

  size(): number {
    return this.queue.length
  }

  empty(): boolean {
    return this.queue.length == 0
  }
}
