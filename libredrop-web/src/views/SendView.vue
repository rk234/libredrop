<script setup lang="ts">
import { me } from '@/transfer/peer'
import { SignalingChannel, type Answer, type Offer } from '@/signaling/signaling'
import { inject, ref, type Ref } from 'vue'
import FilePicker from '../components/FilePicker.vue'
import MessageModal from '../components/MessageModal.vue'
import { sendFile } from '@/transfer/sendProtocol'
import SendProgress from '@/components/SendProgress.vue'
import { createTransferStartMessage } from '@/transfer/messages'

const receiverID = ref<string>('')
const rtcPeerConnection = inject<Ref<RTCPeerConnection>>('rtcConnection')
const files = ref<File[]>([])
const fileSendProgress = ref<number[]>([])

let signalingChannel: SignalingChannel
let dataChannel: RTCDataChannel

const status = ref<'ready' | 'awaiting-answer' | 'answered' | 'rejected' | 'sending'>('ready')

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

      let fileIdx = 0
      for (let file of files.value) {
        console.log(file)
        await sendFile(file, dataChannel, (prog) => {
          console.log(prog)
          fileSendProgress.value!![fileIdx] = prog
        })
        fileIdx++
      }
      files.value = []
      fileSendProgress.value = []
      status.value = 'ready'
      dataChannel!.onmessage = (m: MessageEvent<any>) => console.log(m.data)
      dataChannel.close()
    })

    rtcPeerConnection!.value.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
      if (e.candidate) {
        signalingChannel.sendIceCandidate(e.candidate)
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

function handleModalClose() {
  status.value = 'ready'
}
</script>

<template>
  <MessageModal v-if="status == 'rejected'" title="Send offer rejected by peer!"
    message="Your send offer was rejected by your peer. Make sure the peer id you entered matches exactly with your intended recepient and try again!"
    @close="handleModalClose" />
  <div class="flex flex-col gap-4">
    <SendProgress v-if="files.length > 0" :uploaded-files="files" :upload-progress="fileSendProgress"
      @file-removed="removeFile" />
    <FilePicker @filesUploaded="handleFiles" class="" />

    <div class="flex flex-row gap-2">
      <input v-model="receiverID" class="flex-1 rounded bg-gray-800 p-2" type="text" placeholder="Enter receiver ID"
        :disabled="status != 'ready'" />
      <button class="bg-emerald-600 p-2 rounded" @click="handleSend" :disabled="status != 'ready'">
        Send
      </button>
    </div>
  </div>
</template>
