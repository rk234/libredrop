<script setup lang="ts">
import type { PartialFile } from '@/transfer/partialFile'
import prettyBytes from 'pretty-bytes'

type Props = {
  filesReceived: File[]
  currentFile?: PartialFile
}

defineProps<Props>()

function getUrl(file: File) {
  return window.URL.createObjectURL(file)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-xl font-bold">Received Files</h1>
    <ul v-if="filesReceived.length > 0" class="flex flex-col gap-2">
      <li class="p-2 border border-gray-800 bg-gray-900 items-center rounded flex flex-row gap-2"
        v-for="(file, index) in filesReceived">
        <div class="flex-1 flex gap-4 flex-row">
          <div class="flex flex-1 flex-col">
            <h2 class="text-lg font-bold">{{ file.name }}</h2>
            <p class="text-sm text-slate-400">
              <span class="font-mono">{{ file.type.length == 0 ? 'Unknown Type' : file.type }}
              </span>
              -
              {{ prettyBytes(file.size) }}
            </p>
          </div>
          <a class="bg-gray-800 flex items-center justify-center cursor-pointer p-2 rounded hover:bg-gray-700"
            :href="getUrl(file)" download>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </a>
        </div>
      </li>
    </ul>
    <div v-if="currentFile" class="p-2 border border-gray-800 bg-gray-900 items-center rounded flex flex-row gap-2">
      <div class="flex-1 flex gap-4 flex-row">
        <div class="flex flex-1 flex-col">
          <h2 class="text-lg font-bold">{{ currentFile.name }}</h2>
          <p class="text-sm text-slate-400">
            <span class="font-mono">{{ currentFile.type.length == 0 ? 'Unknown Type' : currentFile.type }}
            </span>
            -
            {{ prettyBytes(currentFile.size) }}
          </p>
          <div class="h-2 bg-gray-700 rounded-full overflow-hidden mt-2">
            <div :style="{ width: `${Math.round(currentFile.progress() * 100)}%` }" class="h-full bg-emerald-600"
              :class="currentFile.progress() < 1 && 'animate-pulse'"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
