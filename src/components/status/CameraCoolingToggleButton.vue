<template>
  <button
    v-if="store.cameraInfo.CanSetTemperature"
    type="button"
    class="flex items-center justify-center rounded-full border p-1 shadow-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60"
    :class="buttonClasses"
    :aria-label="$t('components.camera.camera_cooling')"
    :title="$t('components.camera.camera_cooling')"
    :disabled="cameraStore.coolingActionPending"
    @click.stop="cameraStore.toggleCooling"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="h-5 w-5"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M10 13.5a4 4 0 1 0 4 0v-8.5a2 2 0 0 0 -4 0v8.5" />
      <path d="M10 9l4 0" />
    </svg>
  </button>
</template>

<script setup>
import { computed } from 'vue';
import { apiStore } from '@/store/store';
import { useCameraStore } from '@/store/cameraStore';

const store = apiStore();
const cameraStore = useCameraStore();

const buttonClasses = computed(() => {
  if (cameraStore.coolerStatus === 'warming') {
    return 'border-orange-500/60 bg-orange-500/20 text-orange-300';
  }

  if (cameraStore.isCoolingEnabled) {
    return 'border-cyan-500/60 bg-cyan-500/20 text-cyan-200';
  }

  return 'border-cyan-800 bg-cyan-950 text-gray-300 hover:bg-cyan-900';
});
</script>
