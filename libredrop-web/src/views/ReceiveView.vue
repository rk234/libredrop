<script setup lang="ts">
import { me } from '@/services/peer';
import { SignalingChannel, type Offer } from '@/services/signaling';
import { inject, onMounted, ref } from 'vue'

const signalingChannel = ref<SignalingChannel>()
const rtcPeerConnection = inject<RTCPeerConnection>("rtcConnection")

onMounted(() => {
  if (signalingChannel.value) {
    signalingChannel.value.close()
  }

  signalingChannel.value = new SignalingChannel(me.ID)
  signalingChannel.value.connect()

  signalingChannel.value.onReceiveOffer = handleOffer
})

async function handleOffer(offer: Offer) {
  rtcPeerConnection?.setRemoteDescription(new RTCSessionDescription({
    type: offer.OfferType as RTCSdpType,
    sdp: offer.SDP
  }))

  const answer = await rtcPeerConnection?.createAnswer()

  if (answer) {
    rtcPeerConnection?.setLocalDescription(answer)
    signalingChannel.value?.sendAnswer(me.ID, offer.From, answer.type, answer.sdp || "")
  } else {
    console.log("Something went wrong!")
  }
}
</script>

<template>
  <div class="about">
    <h1>This is an about page</h1>
  </div>
</template>
