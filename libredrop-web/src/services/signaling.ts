import { me, type Peer } from "./peer"

export type SignalingMessage = {
  MessageType: "connect" | "disconnect" | "offer" | "answer"
  MessageData: any
}

export type Answer = {
  From: string
  To: string
  AnswerType: string
  SDP: string
}

export type Offer = {
  From: string
  OfferType: string
  SDP: string
}

export class SignalingChannel {
  receiverID: string
  onMessage: (sm: SignalingMessage) => void
  socket?: WebSocket

  onPeerConnect?: (peer: Peer) => void
  onReceiveOffer?: (offer: Offer) => void
  onReceiveAnswer?: (answer: Answer) => void

  constructor(receiverID: string) {
    this.receiverID = receiverID
    this.onMessage = _ => { }
  }

  connect() {
    this.socket = new WebSocket(this.receiverID)
    this.socket.onopen = _ => {
      this.sendMessage({
        MessageType: "connect",
        MessageData: me
      })
    }
    this.socket.onmessage = this._handleMessage
  }


  _handleMessage(event: MessageEvent<any>) {
    const sm = JSON.parse(event.data) as SignalingMessage

    switch (sm.MessageType) {
      case "connect":
        const peer = sm.MessageData as Peer
        if (peer.ID != me.ID) {
          if (this.onPeerConnect) this.onPeerConnect(peer)
        }
        break
      case "answer":
        const answer = sm.MessageData as Answer
        if (answer.To == me.ID) {
          if (this.onReceiveAnswer) this.onReceiveAnswer(answer)
        }
        break
      case "offer":
        const offer = sm.MessageData as Offer
        if (offer.From != me.ID) {
          if (this.onReceiveOffer) this.onReceiveOffer(offer)
        }
        break
    }
  }

  close() {
    this.sendMessage({
      MessageType: "disconnect",
      MessageData: me
    })
    this.socket?.close()
  }

  sendMessage(sm: SignalingMessage) {
    this.socket?.send(JSON.stringify(sm))
  }

  sendAnswer(
    from: string,
    to: string,
    answerType: string,
    sdp: string
  ) {
    let answer: Answer = {
      From: from,
      To: to,
      AnswerType: answerType,
      SDP: sdp
    }

    this.sendMessage({
      MessageType: "answer",
      MessageData: answer
    })
  }

  sendOffer(
    from: string,
    offerType: string,
    sdp: string
  ) {
    let offer: Offer = {
      From: from,
      OfferType: offerType,
      SDP: sdp
    }

    this.sendMessage({
      MessageType: "offer",
      MessageData: offer
    })
  }
}

