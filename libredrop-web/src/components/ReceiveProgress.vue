<script setup lang="ts">
import type { PartialFile } from '@/services/sendProtocol'

type Props = {
  filesReceived: File[]
  currentFile: PartialFile
}

defineProps<Props>()
</script>

<template>
  <ul>
    <li class="p-2 bg-gray-800 rounded flex flex-row gap-2" v-for="file in filesReceived">
      <div class="flex-1 flex flex-col">
        <h2 class="text-lg font-bold">{{ file.name }}</h2>
        <p>{{ file.type }} - {{ file.size }} bytes</p>
      </div>
      <svg class="text-slate-200 p-2 bg-gray-700 rounded size-6" xmlns="http://www.w3.org/2000/svg" fill="none"
        viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    </li>
  </ul>
  <div class="p-2 bg-gray-800 rounded flex flex-row gap-2"></div>
</template>
