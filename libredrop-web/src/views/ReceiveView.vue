<script setup lang="ts">
import { me } from '@/services/peer'
import { SignalingChannel, type Offer } from '@/services/signaling'
import { type Ref, inject, onMounted, ref } from 'vue'
import { parseFileStartMessage } from '@/services/sendProtocol';

const signalingChannel = ref<SignalingChannel>()
const rtcPeerConnection = inject<Ref<RTCPeerConnection>>('rtcConnection')
onMounted(() => {
  rtcPeerConnection?.value.addEventListener('datachannel', (event) =>
    handleDataChannel(event.channel)
  )

  if (signalingChannel.value) {
    signalingChannel.value.close()
  }

  signalingChannel.value = new SignalingChannel(me.ID)
  signalingChannel.value.connect(() => { })
  signalingChannel.value.setOfferHandler((offer: Offer) => handleOffer(offer))

  rtcPeerConnection!.value.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
    if (e.candidate) {
      signalingChannel.value?.sendIceCandidate(e.candidate)
      rtcPeerConnection?.value.addIceCandidate(e.candidate)
    }
  }
  signalingChannel.value.onReceiveCandidate = (c) => rtcPeerConnection?.value.addIceCandidate(c)
})

function handleDataChannel(channel: RTCDataChannel) {
  channel.send('Hello from receiver')
  channel.onmessage = async (msg: MessageEvent<any>) => console.log(parseFileStartMessage(await (msg.data as Blob).arrayBuffer()))
}

async function handleOffer(offer: Offer) {
  console.log('OFFER: ')
  console.log(offer)
  await rtcPeerConnection?.value.setRemoteDescription(
    new RTCSessionDescription({
      type: offer.OfferType as RTCSdpType,
      sdp: offer.SDP
    })
  )

  const answer = await rtcPeerConnection?.value.createAnswer()

  if (answer) {
    rtcPeerConnection?.value.setLocalDescription(answer)
    signalingChannel.value?.sendAnswer(me.ID, offer.From, answer.type, answer.sdp || '')
  } else {
    console.log('Something went wrong!')
  }
}
</script>

<template>
  <div class="about">
    <h1>{{ me.ID }} - {{ me.DisplayName }}</h1>
  </div>
</template>
