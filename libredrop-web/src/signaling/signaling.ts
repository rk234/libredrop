import { me, type Peer } from '../transfer/peer'

export type SignalingMessage = {
  MessageType: 'connect' | 'disconnect' | 'offer' | 'answer' | 'candidate' | 'rejection'
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
  To: string
  OfferType: string
  SDP: string
}

export class SignalingChannel {
  receiverID: string
  onMessage: (sm: SignalingMessage) => void
  socket?: WebSocket

  onPeerConnect?: (peer: Peer) => void
  onReceiveOffer?: (offer: Offer) => void
  onReceiveRejection?: (rejectedOffer: Offer) => void
  onReceiveAnswer?: (answer: Answer) => void
  onReceiveCandidate?: (candidate: RTCIceCandidate) => void

  constructor(receiverID: string) {
    this.receiverID = receiverID
    this.onMessage = (_) => { }
  }

  connect(onReady: () => void) {
    this.socket = new WebSocket('ws://192.168.0.110:3000/channel/' + this.receiverID)
    console.log('CHANNEL:')
    console.log('ws://localhost:3000/channel/' + this.receiverID)
    this.socket.onopen = (_) => {
      this.sendMessage({
        MessageType: 'connect',
        MessageData: me
      })
      onReady()
    }

    const sc: SignalingChannel = this
    this.socket.onmessage = (event: MessageEvent<any>) => this._handleMessage(sc, event)
  }

  setOfferHandler(handler: (offer: Offer) => void) {
    this.onReceiveOffer = handler
  }

  setAnswerHandler(handler: (offer: Answer) => void) {
    this.onReceiveAnswer = handler
  }

  _handleMessage(channel: SignalingChannel, event: MessageEvent<any>) {
    const sm = JSON.parse(event.data) as SignalingMessage

    switch (sm.MessageType) {
      case 'connect':
        const peer = sm.MessageData as Peer
        if (peer.ID != me.ID) {
          if (channel.onPeerConnect) channel.onPeerConnect(peer)
        }
        break
      case 'answer':
        const answer = sm.MessageData as Answer
        if (answer.To == me.ID) {
          if (channel.onReceiveAnswer) channel.onReceiveAnswer(answer)
        }
        break
      case 'offer':
        const offer = sm.MessageData as Offer
        if (offer.From != me.ID) {
          if (channel.onReceiveOffer) channel.onReceiveOffer(offer)
        }
        break
      case 'candidate':
        console.log('CANDIDATE RECEIVED!')
        const candidate = sm.MessageData as RTCIceCandidate
        if (channel.onReceiveCandidate) channel.onReceiveCandidate(candidate)
        break
      case 'rejection':
        console.log('OFFER REJECTED')
        const rejectedOffer = sm.MessageData as Offer
        if (rejectedOffer.From == me.ID) {
          if (channel.onReceiveRejection) channel.onReceiveRejection(rejectedOffer)
        }
    }
  }

  close() {
    this.sendMessage({
      MessageType: 'disconnect',
      MessageData: me
    })
    this.socket?.close()
  }

  sendMessage(sm: SignalingMessage) {
    this.socket?.send(JSON.stringify(sm))
  }

  sendAnswer(from: string, to: string, answerType: string, sdp: string) {
    const answer: Answer = {
      From: from,
      To: to,
      AnswerType: answerType,
      SDP: sdp
    }

    this.sendMessage({
      MessageType: 'answer',
      MessageData: answer
    })
  }

  sendOffer(from: string, to: string, offerType: string, sdp: string) {
    const offer: Offer = {
      From: from,
      To: to,
      OfferType: offerType,
      SDP: sdp
    }

    this.sendMessage({
      MessageType: 'offer',
      MessageData: offer
    })
  }

  sendIceCandidate(candidate: RTCIceCandidate) {
    this.sendMessage({
      MessageType: 'candidate',
      MessageData: candidate.toJSON()
    })
  }

  sendRejection(offer: Offer) {
    this.sendMessage({
      MessageType: 'rejection',
      MessageData: offer
    })
  }
}
