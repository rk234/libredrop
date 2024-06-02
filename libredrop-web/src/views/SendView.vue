<script setup lang="ts">
import { me } from '@/services/peer';
import { SignalingChannel, type Answer } from '@/services/signaling';
import { inject, ref } from 'vue';

const receiverID = ref<string>("")
const rtcPeerConnection = inject<RTCPeerConnection>("rtcConnection")

function handleDrop(event: DragEvent) {
  if (!event.dataTransfer) return;

  if (event.dataTransfer.items) {
    [...event.dataTransfer.items].forEach(async (item, i) => {
      if (item.kind == "file") {
        const file = item.getAsFile()
        console.log(file)
        console.log(await file?.arrayBuffer())
      }
    })
  } else {
    [...event.dataTransfer.files].forEach(async (file, i) => {
      console.log(file)
      console.log(await file.arrayBuffer())
    })
  }
}

function handleAnswer(answer: Answer) {

}

async function handleSend() {
  if (receiverID.value.trim().length > 0) {
    const signalingChannel = new SignalingChannel(receiverID.value)
    signalingChannel.connect()

    const offer = await rtcPeerConnection?.createOffer()
    rtcPeerConnection?.setLocalDescription(offer)

    signalingChannel.sendOffer(me.ID, offer?.type || "", offer?.sdp || "")
    signalingChannel.onReceiveAnswer = handleAnswer
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div @drop.prevent="handleDrop" @dragenter.prevent @dragover.prevent
      class="border-2 min-h-52 border-dashed rounded-md border-gray-800 p-4 flex items-center justify-center">
      <h2>Drop files here</h2>
    </div>
    <p class="text-center text-lg">or</p>
    <textarea class="bg-gray-950 border-2 border-gray-800 p-2 min-h-28 text-gray-200 rounded-md"
      placeholder="Enter text to send"></textarea>

    <div class="flex flex-row gap-2">
      <input :value="receiverID" class="flex-1 rounded bg-gray-800 p-2" type="text" placeholder="Enter receiver ID" />
      <button class="bg-emerald-600 p-2 rounded">Send</button>
    </div>
  </div>
</template>
