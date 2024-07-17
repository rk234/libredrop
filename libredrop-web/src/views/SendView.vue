<script setup lang="ts">
import { me } from '@/transfer/peer'
import { SERVER_DOMAIN_HTTP, SignalingChannel, type Answer, type Offer } from '@/signaling/signaling'
import { computed, inject, ref, type Ref } from 'vue'
import FilePicker from '../components/FilePicker.vue'
import MessageModal from '../components/MessageModal.vue'
import { sendFile } from '@/transfer/sendProtocol'
import SendProgress from '@/components/SendProgress.vue'
import { createTransferStartMessage } from '@/transfer/messages'
import axios from 'axios'

const receiverID = ref<string>('')
const discoveredPeers = ref<string[]>([])
const matchedPeers = computed<string[]>(() => discoveredPeers.value.filter(p => p.includes(receiverID.value)))
const rtcPeerConnection = inject<Ref<RTCPeerConnection>>('rtcConnection')
const files = ref<File[]>([])
const fileSendProgress = ref<number[]>([])

const filePicker = ref<InstanceType<typeof FilePicker> | null>(null)

let signalingChannel: SignalingChannel
let dataChannel: RTCDataChannel
let discoveryReqController: AbortController

const status = ref<'ready' | 'awaiting-answer' | 'answered' | 'rejected' | 'sending' | 'ice-problem'>('ready')

function handleAnswer(answer: Answer) {
  console.log('Received answer!')
  rtcPeerConnection?.value.setRemoteDescription(
    new RTCSessionDescription({
      type: answer.AnswerType as RTCSdpType,
      sdp: answer.SDP
    })
  )
}

function handleRejection(rejectedOffer: Offer) {
  console.log('OFFER REJECTED!')
  console.log(rejectedOffer)
  signalingChannel.close()
  dataChannel.close()
  status.value = 'rejected'
}

function closeAndCleanup() {
  files.value = []
  fileSendProgress.value = []
  status.value = 'ready'
  dataChannel.close()
  signalingChannel.close()
  filePicker.value?.clear()

  rtcPeerConnection!!.value.close()
  rtcPeerConnection!!.value = new RTCPeerConnection()
}

async function handleSend() {
  console.log(receiverID.value)
  status.value = 'awaiting-answer'

  //TODO: Reset necessary state to prepare for new transfer
  if (receiverID.value.trim().length > 0) {
    signalingChannel = new SignalingChannel(me.ID)
    dataChannel = rtcPeerConnection!!.value.createDataChannel('file-send-channel', {
      ordered: true
    })
    dataChannel.binaryType = 'arraybuffer'
    dataChannel.bufferedAmountLowThreshold = 65535 //64kb

    const reader = new FileReader()
    reader.addEventListener('error', (err) => console.log(err))
    reader.addEventListener('abort', (err) => console.log('Abort: ' + err))

    dataChannel.addEventListener('open', async (_) => {
      console.log('DATA CHANNEL OPENED')
      dataChannel.send(createTransferStartMessage(files.value.length))
      status.value = 'sending'

      let fileIdx = 0
      for (let file of files.value) {
        console.log(file)
        await sendFile(file, dataChannel, (prog) => {
          console.log(prog)
          fileSendProgress.value!![fileIdx] = prog
        })
        fileIdx++
      }

      //cleaning up
      closeAndCleanup()
    })

    rtcPeerConnection!.value.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
      if (e.candidate) {
        signalingChannel.sendIceCandidate(e.candidate)
      }
    }

    rtcPeerConnection!.value.oniceconnectionstatechange = (e) => {
      console.log("ICE CONNECTION STATE: ", rtcPeerConnection!.value.iceConnectionState)
      if (rtcPeerConnection!.value.iceConnectionState == "disconnected" || rtcPeerConnection!.value.iceConnectionState == "failed") {
        closeAndCleanup()
        status.value = 'ice-problem'
      }
    }

    signalingChannel.connect(async () => {
      const offer = await rtcPeerConnection?.value.createOffer()
      await rtcPeerConnection?.value.setLocalDescription(offer)

      signalingChannel.sendOffer(me.ID, receiverID.value, offer?.type || '', offer?.sdp || '')
      signalingChannel.onReceiveAnswer = handleAnswer
      signalingChannel.onReceiveRejection = handleRejection
      signalingChannel.onReceiveCandidate = (c) => {
        rtcPeerConnection?.value.addIceCandidate(c)
      }
    })
  }
}

function handleFiles(uploaded: File[]) {
  files.value = uploaded
  fileSendProgress.value = files.value.map((_) => 0)
}

function removeFile(i: number) {
  files.value.splice(i, 1)
  fileSendProgress.value.splice(i, 1)
}

function handleErrorModalClose() {
  status.value = 'ready'
}

async function handlePeerIDInput() {
  if (discoveryReqController) discoveryReqController.abort()
  discoveryReqController = new AbortController()
  const data = (await axios.get(SERVER_DOMAIN_HTTP + "/discovery/find/" + me.ID, { signal: discoveryReqController.signal })).data as string
  discoveredPeers.value = data.split(",")
}
</script>

<template>
  <MessageModal v-if="status == 'rejected'" title="Send offer rejected by peer!"
    message="Your send offer was rejected by your peer. Make sure the peer id you entered matches exactly with your intended recepient and try again!"
    @close="handleErrorModalClose" />
  <MessageModal v-if="status == 'ice-problem'" title="Something went wrong"
    message="It seems that a problem has occured with the connection to your peer." @close="handleErrorModalClose" />
  <div class="flex flex-col gap-4">
    <SendProgress v-if="files.length > 0" :uploaded-files="files" :upload-progress="fileSendProgress"
      @file-removed="removeFile" />
    <FilePicker v-if="status != 'sending'" ref="filePicker" @filesUploaded="handleFiles" class="" />

    <div class="relative">
      <div v-if="status == 'ready'" class="flex flex-row gap-2">
        <input v-model="receiverID" class="flex-1 rounded bg-gray-800 p-2" type="text" placeholder="Enter receiver ID"
          :disabled="status != 'ready'" @input="handlePeerIDInput" />
        <button
          class="bg-emerald-400 text-gray-900 font-bold disabled:bg-gray-800 disabled:text-gray-200 p-2 rounded flex flex-row gap-2 items-center"
          @click="handleSend"
          :disabled="status != 'ready' || receiverID.length == 0 || !discoveredPeers.includes(receiverID)">
          <p>
            Send
          </p>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
            stroke="currentColor" class="size-4">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
        </button>
      </div>
      <div v-if="status == 'ready' && receiverID.trim().length > 0"
        class="absolute top-12 left-0 p-2 right-0 rounded bg-gray-800">
        <ul v-if="matchedPeers.length > 0" class="flex flex-col justify-center gap-2">
          <button class="flex flex-row gap-2 hover:bg-gray-700 p-2 rounded" v-for="peer in matchedPeers"
            @click="() => receiverID = peer">
            <div class="rounded-full bg-emerald-400 p-1 text-xs text-gray-900 font-bold">Online</div>
            <span>
              {{ peer }}
            </span>
          </button>
        </ul>
        <p v-if="matchedPeers.length == 0">No peers found with ID: {{ receiverID
          }}</p>
      </div>
    </div>
    <div v-if="status == 'awaiting-answer'" class="rounded bg-gray-800 p-4 flex flex-row gap-2">
      <p class="flex-1">
        Awaiting an answer from peer <span class="font-mono">{{ receiverID }}</span>
      </p>
      <svg class="animate-spin h-6 w-6 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none"
        viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
        </path>
      </svg>
    </div>
  </div>
</template>
