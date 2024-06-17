<script setup lang="ts">
import prettyBytes from 'pretty-bytes'

type Props = {
  uploadedFiles: File[]
  uploadProgress: number[]
}

const props = defineProps<Props>()
</script>

<template>
  <h1 class="text-xl font-bold">Files to send</h1>
  <ul class="flex flex-col gap-2">
    <li
      class="p-2 border border-emerald-900 bg-gray-900 items-center rounded flex flex-row gap-2"
      v-for="(file, index) in uploadedFiles"
    >
      <div class="flex-1 flex flex-col">
        <h2 class="text-lg font-bold">{{ file.name }}</h2>
        <p class="text-sm text-slate-400">
          <span class="font-mono">{{ file.type.length == 0 ? 'Unknown Type' : file.type }} </span> -
          {{ prettyBytes(file.size) }}
        </p>
        <div class="h-2 bg-gray-700 rounded-full overflow-hidden mt-2">
          <div
            :style="{ width: `${Math.round(uploadProgress[index] * 100)}%` }"
            class="h-full bg-emerald-600 animate-pulse"
          ></div>
        </div>
      </div>
    </li>
  </ul>
</template>
