<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="w-full h-full p-8 flex flex-col items-center bg-gray-950 text-gray-200">
    <div class="w-full max-w-2xl border-2 rounded border-emerald-900">
      <header class="p-2">
        <nav class="flex flex-row gap-2">
          <RouterLink class="flex-1 text-center p-2 bg-emerald-800 rounded" to="/">Send</RouterLink>
          <RouterLink class="flex-1 text-center p-2 rounded" to="/about">Receive</RouterLink>
        </nav>
      </header>

      <div class="p-2 border-t-2 border-emerald-900">
        <RouterView />
      </div>
    </div>
  </div>
</template>
