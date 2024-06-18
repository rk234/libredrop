<script setup lang="ts">
import { provide, ref, watch, type Ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()
const currentPage = ref(route.name)

watch(route, () => (currentPage.value = route.name))

const rtcPeerConnection = ref<RTCPeerConnection>(new RTCPeerConnection())
provide('rtcConnection', rtcPeerConnection)
</script>

<template>
  <div class="w-full min-h-screen py-8 px-2 flex flex-col items-center bg-gray-950 text-gray-200">
    <div class="w-full max-w-2xl">
      <header class="p-2">
        <div class="mb-8">
          <h1 class="text-4xl font-bold mb-1">Libredrop</h1>
          <p>Simple peer-to-peer file sharing</p>
        </div>
        <nav class="flex flex-row gap-2">
          <RouterLink
            class="transition flex-1 text-center p-2 rounded border border-emerald-900 hover:bg-emerald-700"
            :class="{ 'bg-emerald-700': currentPage == 'send' }"
            to="/send"
          >
            Send</RouterLink
          >
          <RouterLink
            class="transition flex-1 text-center p-2 rounded border border-emerald-900 hover:bg-emerald-700"
            :class="{ 'bg-emerald-700': currentPage == 'receive' }"
            to="/receive"
            >Receive</RouterLink
          >
        </nav>
      </header>

      <div class="p-2">
        <RouterView />
      </div>
    </div>
  </div>
</template>
