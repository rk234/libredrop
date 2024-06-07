<script setup lang="ts">
import { me } from '@/services/peer'
import { SignalingChannel, type Answer } from '@/services/signaling'
import { inject, ref, type Ref } from 'vue'
import FilePicker from "../components/FilePicker.vue"

const receiverID = ref<string>('')
const rtcPeerConnection = inject<Ref<RTCPeerConnection>>('rtcConnection')
const files = ref<File[]>([])

function handleAnswer(answer: Answer) {
  console.log('Received answer!')
  rtcPeerConnection?.value.setRemoteDescription(
    new RTCSessionDescription({
      type: answer.AnswerType as RTCSdpType,
      sdp: answer.SDP
    })
  )
}

async function handleSend() {
  console.log(receiverID.value)
  if (receiverID.value.trim().length > 0) {
    const signalingChannel = new SignalingChannel(me.ID)
    const channel = rtcPeerConnection?.value.createDataChannel('file-send-channel')
    console.log(channel)
    channel?.addEventListener('open', (_) => {
      console.log('CHANNEL OPENED')
      channel?.send('Hello from sender')
      channel!.onmessage = (m: MessageEvent<any>) => console.log(m.data)
    })

    rtcPeerConnection!.value.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
      if (e.candidate) {
        signalingChannel.sendIceCandidate(e.candidate)
        rtcPeerConnection?.value.addIceCandidate(e.candidate)
      }
    }

    signalingChannel.connect(async () => {
      const offer = await rtcPeerConnection?.value.createOffer()
      await rtcPeerConnection?.value.setLocalDescription(offer)

      signalingChannel.sendOffer(me.ID, offer?.type || '', offer?.sdp || '')
      signalingChannel.onReceiveAnswer = handleAnswer
      signalingChannel.onReceiveCandidate = (c) => {
        rtcPeerConnection?.value.addIceCandidate(c)
      }
    })
  }
}

function handleFiles(files: File[]) {
  console.log(files)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <FilePicker @filesUploaded="handleFiles" class="" />
    <p class="text-center text-lg">or</p>
    <textarea class="bg-gray-950 border-2 border-gray-800 p-2 min-h-28 text-gray-200 rounded-md"
      placeholder="Enter text to send"></textarea>

    <div class="flex flex-row gap-2">
      <input v-model="receiverID" class="flex-1 rounded bg-gray-800 p-2" type="text" placeholder="Enter receiver ID" />
      <button class="bg-emerald-600 p-2 rounded" @click="handleSend">Send</button>
    </div>
  </div>
</template>
