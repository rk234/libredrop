<script lang="ts" setup>
import { onErrorCaptured, ref } from 'vue';

const error = ref<Error>()

onErrorCaptured((err) => {
  error.value = err
})
</script>


<template>
  <div>

  </div>
</template>
