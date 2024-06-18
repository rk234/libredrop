<script setup lang="ts">
import prettyBytes from 'pretty-bytes'

type Props = {
  uploadedFiles: File[]
  uploadProgress: number[]
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'fileRemoved', fileIndex: number): void
}>()

function removeFile(index: number) {
  emit('fileRemoved', index)
}
</script>

<template>
  <h1 class="text-xl font-bold">Files to send</h1>
  <ul class="flex flex-col gap-2">
    <li
      class="p-2 border border-gray-800 bg-gray-900 items-center rounded flex flex-row gap-2"
      v-for="(file, index) in uploadedFiles"
    >
      <div class="flex-1 flex gap-4 flex-row">
        <div class="flex flex-1 flex-col">
          <h2 class="text-lg font-bold">{{ file.name }}</h2>
          <p class="text-sm text-slate-400">
            <span class="font-mono">{{ file.type.length == 0 ? 'Unknown Type' : file.type }} </span>
            -
            {{ prettyBytes(file.size) }}
          </p>
          <div class="h-2 bg-gray-700 rounded-full overflow-hidden mt-2">
            <div
              :style="{ width: `${Math.round(uploadProgress[index] * 100)}%` }"
              class="h-full bg-emerald-600"
              :class="uploadProgress[index] < 1 && 'animate-pulse'"
            ></div>
          </div>
        </div>
        <button class="bg-red-700 p-2 rounded hover:bg-red-600" @click="() => removeFile(index)">
          Don't Send
        </button>
      </div>
    </li>
  </ul>
</template>
