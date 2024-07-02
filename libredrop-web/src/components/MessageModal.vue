<script setup lang="ts">
type Props = {
  title: string
  message: string
}

const emit = defineEmits<{
  (e: "close"): void
}>()

const props = defineProps<Props>()
</script>

<template>
  <div class="absolute bg-black/50 z-10 top-0 left-0 bottom-0 right-0 flex flex-col items-center justify-center">
    <div class="bg-gray-800 rounded-md p-4 flex flex-col max-w-xl w-full gap-4">
      <div class="flex flex-row gap-4 items-center">
        <h1 class="font-bold text-2xl flex-1">{{ props.title }}</h1>
        <button class="rounded-full bg-gray-700 p-1 text-gray-200" @click="() => emit('close')">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
            stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p class="text-lg leading-normal">
        {{ props.message }}
      </p>
    </div>
  </div>
</template>
