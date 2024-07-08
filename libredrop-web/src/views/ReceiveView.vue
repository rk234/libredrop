<script setup lang="ts">
import { me } from '@/transfer/peer'
import { SignalingChannel, type Offer } from '@/signaling/signaling'
import { type Ref, inject, onMounted, ref } from 'vue'
import ReceiveProgress from '@/components/ReceiveProgress.vue'
import {
  messageType,
  parseFileDataMessage,
  parseFileStartMessage,
  parseTransferStartMessage
} from '@/transfer/messages'
import { PartialFile } from '@/transfer/partialFile'

let signalingChannel: SignalingChannel
const status = ref<'awaiting' | 'offered' | 'receiving' | 'done'>('awaiting')
const rtcPeerConnection = inject<Ref<RTCPeerConnection>>('rtcConnection')
const currentOffer = ref<Offer>()

const numberOfFilesExpected = ref<number>()
const receivedFiles = ref<File[]>([])
const currentFile = ref<PartialFile>()

onMounted(() => {
  rtcPeerConnection?.value.addEventListener('datachannel', (event) =>
    handleDataChannel(event.channel)
  )

  if (signalingChannel) {
    signalingChannel.close()
  }

  signalingChannel = new SignalingChannel(me.ID)
  signalingChannel.connect(() => console.log('Connected to signaling channel!'))
  signalingChannel.setOfferHandler((offer: Offer) => handleOffer(offer))

  rtcPeerConnection!.value.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
    if (e.candidate) {
      signalingChannel.sendIceCandidate(e.candidate)
    }
  }
  signalingChannel.onReceiveCandidate = (c) => {
    if (rtcPeerConnection?.value.remoteDescription) rtcPeerConnection?.value.addIceCandidate(c)
  }
})

function handleDataChannel(channel: RTCDataChannel) {
  channel.send('Hello from receiver')
  channel.binaryType = 'arraybuffer'
  channel.onmessage = (msg: MessageEvent<any>) => {
    const buf = msg.data as ArrayBuffer
    const mt = messageType(buf)

    if (mt == 0) {
      //FILE START
      const startMsg = parseFileStartMessage(buf)
      console.log('START')
      console.log(startMsg)
      status.value = 'receiving'
      currentFile.value = new PartialFile(startMsg)
    } else if (mt == 1) {
      //DATA
      const fileDataMsg = parseFileDataMessage(buf)
      console.log(fileDataMsg)
      currentFile.value!!.addChunk(fileDataMsg)

      if (currentFile.value!!.isDone()) {
        console.log('DONE!')
        receivedFiles.value.push(currentFile.value!!.createFile())
        currentFile.value = undefined

        if (receivedFiles.value.length == numberOfFilesExpected.value) {
          console.log('RECEIVED ALL FILES!')
          status.value = 'done'
        }
      }
    } else if (mt == 3) {
      //TRANSFER START
      const tsMsg = parseTransferStartMessage(buf)
      console.log('TRANSFER START')
      console.log(tsMsg)
      numberOfFilesExpected.value = tsMsg.numberOfFiles
    }
  }
}

async function handleOffer(offer: Offer) {
  console.log('OFFER: ')
  currentOffer.value = offer
  status.value = 'offered'
  //TODO: Reset necessary state to prepare for new transfer, keep files
}

async function acceptOffer() {
  if (!currentOffer.value) throw new Error('No offer to accept!')

  await rtcPeerConnection?.value.setRemoteDescription(
    new RTCSessionDescription({
      type: currentOffer.value.OfferType as RTCSdpType,
      sdp: currentOffer.value.SDP
    })
  )

  const answer = await rtcPeerConnection?.value.createAnswer()

  if (answer) {
    rtcPeerConnection?.value.setLocalDescription(answer)
    signalingChannel.sendAnswer(
      me.ID,
      currentOffer.value.From,
      answer.type,
      answer.sdp || ''
    )
  } else {
    throw new Error('Failed to generate answer!')
  }
}

function rejectOffer() {
  if (currentOffer.value) {
    signalingChannel.sendRejection(currentOffer.value)
    status.value = 'awaiting'
  } else {
    throw new Error('No offer to reject!')
  }
}

function statusMessage(): string {
  switch (status.value) {
    case 'awaiting':
      return 'Awaiting offer...'
    case 'offered':
      return 'Received an offer!'
    case 'receiving':
      return 'Receiving files...'
    case 'done':
      return 'Transfer Complete!'
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="bg-gray-900 flex flex-col rounded p-4">
      <div class="flex flex-row items-center">
        <h1 class="font-bold flex-1">Status</h1>
        <div class="flex flex-row gap-2 items-center">
          <p>{{ statusMessage() }}</p>
          <svg v-if="status == 'awaiting' || status == 'receiving'" class="animate-spin h-6 w-6 text-emerald-400"
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          <svg v-if="status == 'done' || status == 'offered'" xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
      </div>
      <hr class="border border-gray-700 my-4" />
      <div v-if="status == 'awaiting'" class="flex items-center flex-col">
        <p>Pull up libredrop on another device to transfer files!</p>
      </div>
      <div v-else-if="status == 'offered'" class="flex flex-col gap-4">
        <h1>
          Received an offer from <span class="font-mono font-bold">{{ currentOffer?.From }}</span>!
        </h1>
        <div class="flex flex-row gap-2">
          <button class="flex-1 p-2 transition text-center rounded border border-emerald-900 hover:bg-emerald-700"
            @click="acceptOffer">
            Accept
          </button>
          <button class="flex-1 p-2 transition text-center rounded border border-red-900 hover:bg-red-700"
            @click="rejectOffer">
            Reject
          </button>
        </div>
      </div>
      <div v-else-if="status == 'receiving' || status == 'done'" class="flex flex-col">
        <ReceiveProgress :files-received="receivedFiles" :current-file="currentFile" />
      </div>
    </div>
    <div class="bg-gray-900 rounded p-4">
      <h1 class="font-bold">
        Your Peer ID: <span class="font-mono">{{ me.ID }}</span>
      </h1>
    </div>
  </div>
</template>
