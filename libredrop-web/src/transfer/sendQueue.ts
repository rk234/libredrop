import type { FileDataMessage } from './messages'

export default class SendQueue {
  queue: ArrayBuffer[]

  constructor() {
    this.queue = []
  }

  offer(fdm: ArrayBuffer) {
    this.queue.push(fdm)
  }

  poll(): ArrayBuffer {
    return this.queue.shift()!!
  }

  size(): number {
    return this.queue.length
  }

  empty(): boolean {
    return this.queue.length == 0
  }
}
