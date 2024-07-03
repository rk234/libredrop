<script setup lang="ts">
import { ref } from "vue"
type Props = {
  class: string
}

const props = defineProps<Props>()
const files = ref<File[]>([])
const inputBox = ref<HTMLInputElement>()

const emit = defineEmits<{
  (e: "filesUploaded", files: File[]): void
}>()

function handleDrop(event: DragEvent) {
  if (!event.dataTransfer) return

  if (event.dataTransfer.items) {
    [...event.dataTransfer.items].forEach(async (item, _) => {
      if (item.kind == 'file') {
        const file = item.getAsFile()
        if (file) {
          console.log("Loaded file " + file.name)
          files.value.push(file)
        }
      }
    })
  } else {
    [...event.dataTransfer.files].forEach(async (file, _) => {
      if (file) {
        console.log("Loaded file " + file.name)
        files.value.push(file)
      }
    })
  }
  emit("filesUploaded", files.value)
}

function handleInputElementChange(event: Event) {
  const uploadedFiles = (event.target!! as HTMLInputElement).files
  if (uploadedFiles) {
    for (var i = 0; i < uploadedFiles.length; i++) {
      if (uploadedFiles.item(i)) {
        files.value.push(uploadedFiles.item(i)!!)
      }
    }
    emit("filesUploaded", files.value)
  }
}

function clear() {
  if (inputBox.value) inputBox.value.value = ''
  files.value = []
}

defineExpose({
  clear
})
</script>

<template>
  <div @drop.prevent="handleDrop" @dragenter.prevent @dragover.prevent @click="() => inputBox?.click()"
    class="border-2 min-h-52 border-dashed rounded-md border-gray-800 p-4 flex items-center cursor-pointer justify-center"
    :class="props.class">
    <h2>Drop files here or click to select files!</h2>
    <input ref="inputBox" multiple v-on:change="handleInputElementChange" type="file" class="hidden" />
  </div>
</template>
