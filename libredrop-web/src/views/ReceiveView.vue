<script setup lang="ts">
import { me } from '@/services/peer'
import { SignalingChannel, type Offer } from '@/services/signaling'
import { type Ref, inject, onMounted, ref } from 'vue'
import { messageType, parseFileDataMessage, parseFileStartMessage } from '@/services/sendProtocol';

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
  signalingChannel.value.connect(() => console.log("Connected to signaling channel!"))
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
  channel.onmessage = async (msg: MessageEvent<any>) => {
    const buf = await (msg.data as Blob).arrayBuffer()
    const mt = messageType(buf)

    if (mt == 0) { //START
      console.log(parseFileStartMessage(buf))
    } else if (mt == 1) { //DATA
      console.log(parseFileDataMessage(buf))
    } else if (mt == 2) { //END
      console.log("END!")
    }
  }
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
    console.log('Failed to generate answer')
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="bg-gray-900 flex flex-col rounded p-4">
      <div class="flex flex-row items-center">
        <h1 class="font-bold flex-1">Status</h1>
        <div class="flex flex-row gap-2 items-center">
          <p>Awaiting Offer...</p>
          <svg class="animate-spin h-6 w-6 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
        </div>
      </div>
    </div>
    <div class="bg-gray-900 rounded p-4">
      <h1 class="font-bold"> Your Peer ID: <span class="font-mono">{{ me.ID }}</span></h1>
    </div>
  </div>
</template>
