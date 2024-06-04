<script setup lang="ts">
import { me } from '@/services/peer';
import { SignalingChannel, type Offer } from '@/services/signaling';
import { type Ref, inject, onMounted, ref } from 'vue'

const signalingChannel = ref<SignalingChannel>()
const rtcPeerConnection = inject<Ref<RTCPeerConnection>>("rtcConnection")
onMounted(() => {
  if (signalingChannel.value) {
    signalingChannel.value.close()
  }

  signalingChannel.value = new SignalingChannel(me.ID)
  signalingChannel.value.connect(() => { })
  signalingChannel.value.setOfferHandler((offer: Offer) => handleOffer(offer))
})

async function handleOffer(offer: Offer) {
  console.log("OFFER: " + offer)
  rtcPeerConnection?.value.setRemoteDescription(new RTCSessionDescription({
    type: offer.OfferType as RTCSdpType,
    sdp: offer.SDP
  }))

  const answer = await rtcPeerConnection?.value.createAnswer()

  if (answer) {
    rtcPeerConnection?.value.setLocalDescription(answer)
    signalingChannel.value?.sendAnswer(me.ID, offer.From, answer.type, answer.sdp || "")
  } else {
    console.log("Something went wrong!")
  }
}
</script>

<template>
  <div class="about">
    <h1>{{ me.ID }} - {{ me.DisplayName }}</h1>
  </div>
</template>
