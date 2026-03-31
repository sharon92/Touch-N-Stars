<template>
  <button
    @click="toggleControls"
    class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md"
    :class="{ 'bg-cyan-600': settingsVisible }"
  >
    <Cog6ToothIcon class="w-7 h-7" />
  </button>

  <Modal :show="settingsVisible" @close="settingsVisible = false" zIndex="z-40">
    <template #header>
      <h3>{{ $t('components.stellarium.settings.title') }}</h3>
    </template>
    <template #body>
      <!-- Settings Container with conditional grid layout -->
      <div :class="settingsContainerClasses">
        <div
          class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
        >
          <label for="constellationsLinesVisible" class="text-gray-400">
            {{ $t('components.stellarium.settings.constellations_lines_visible') }}
          </label>
          <div>
            <toggleButton
              @click="
                settingsStore.stellarium.constellationsLinesVisible =
                  !settingsStore.stellarium.constellationsLinesVisible
              "
              :status-value="settingsStore.stellarium.constellationsLinesVisible"
            />
          </div>
        </div>

        <div
          class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
        >
          <label for="azimuthalLinesVisible" class="text-gray-400">
            {{ $t('components.stellarium.settings.azimuthal_lines_visible') }}
          </label>
          <div>
            <toggleButton
              @click="
                settingsStore.stellarium.azimuthalLinesVisible =
                  !settingsStore.stellarium.azimuthalLinesVisible
              "
              :status-value="settingsStore.stellarium.azimuthalLinesVisible"
            />
          </div>
        </div>

        <div
          class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
        >
          <label for="equatorialLinesVisible" class="text-gray-400">
            {{ $t('components.stellarium.settings.equatorial_lines_visible') }}
          </label>
          <div>
            <toggleButton
              @click="
                settingsStore.stellarium.equatorialLinesVisible =
                  !settingsStore.stellarium.equatorialLinesVisible
              "
              :status-value="settingsStore.stellarium.equatorialLinesVisible"
            />
          </div>
        </div>

        <div
          class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
        >
          <label for="meridianLinesVisible" class="text-gray-400">
            {{ $t('components.stellarium.settings.meridian_lines_visible') }}
          </label>
          <div>
            <toggleButton
              @click="
                settingsStore.stellarium.meridianLinesVisible =
                  !settingsStore.stellarium.meridianLinesVisible
              "
              :status-value="settingsStore.stellarium.meridianLinesVisible"
            />
          </div>
        </div>

        <div
          class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
        >
          <label for="eclipticLinesVisible" class="text-gray-400">
            {{ $t('components.stellarium.settings.ecliptic_lines_visible') }}
          </label>
          <div>
            <toggleButton
              @click="
                settingsStore.stellarium.eclipticLinesVisible =
                  !settingsStore.stellarium.eclipticLinesVisible
              "
              :status-value="settingsStore.stellarium.eclipticLinesVisible"
            />
          </div>
        </div>

        <div class="text-xs font-semibold uppercase tracking-wide text-cyan-300 px-1 pt-1">
          {{ $t('components.stellarium.settings.terrestrial_objects') }}
        </div>

        <div
          class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
        >
          <label for="atmosphereVisible" class="text-gray-400">
            {{ $t('components.stellarium.settings.atmosphere_visible') }}
          </label>
          <div>
            <toggleButton
              @click="
                settingsStore.stellarium.atmosphereVisible =
                  !settingsStore.stellarium.atmosphereVisible
              "
              :status-value="settingsStore.stellarium.atmosphereVisible"
            />
          </div>
        </div>

        <div
          class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
        >
          <label for="landscapesVisible" class="text-gray-400">
            {{ $t('components.stellarium.settings.landscapes_visible') }}
          </label>
          <div>
            <toggleButton
              @click="toggleLandscapeVisibility"
              :status-value="settingsStore.stellarium.landscapesVisible"
            />
          </div>
        </div>

        <div
          class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
        >
          <label for="dsosVisible" class="text-gray-400">
            {{ $t('components.stellarium.settings.dsos_visible') }}
          </label>
          <div>
            <toggleButton
              @click="settingsStore.stellarium.dsosVisible = !settingsStore.stellarium.dsosVisible"
              :status-value="settingsStore.stellarium.dsosVisible"
            />
          </div>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { useStellariumStore } from '@/store/stellariumStore';
import { useSettingsStore } from '@/store/settingsStore';
import toggleButton from '@/components/helpers/toggleButton.vue';
import { watch, ref, computed } from 'vue';
import { Cog6ToothIcon } from '@heroicons/vue/24/outline';
import { useOrientation } from '@/composables/useOrientation';
import Modal from '@/components/helpers/Modal.vue';

const stellariumStore = useStellariumStore();
const settingsStore = useSettingsStore();
const settingsVisible = ref(false);

function toggleControls() {
  settingsVisible.value = !settingsVisible.value;
}

function toggleLandscapeVisibility() {
  settingsStore.stellarium.landscapesVisible = !settingsStore.stellarium.landscapesVisible;
}

// Check if in landscape mode
const { isLandscape } = useOrientation();

// Settings container classes for grid layout
const settingsContainerClasses = computed(() => ({
  // Portrait mode - single column
  'flex flex-col gap-1': !isLandscape.value,
  // Landscape mode - two columns
  'grid grid-cols-2 gap-2': isLandscape.value,
}));

watch(() => settingsStore.stellarium, stellariumStore.updateStellariumCore, { deep: true });
</script>
<style scoped>
/* Scrollbar styling for landscape mode */
@media screen and (orientation: landscape) {
  .overflow-y-auto::-webkit-scrollbar {
    width: 4px;
  }

  .overflow-y-auto::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: rgba(6, 182, 212, 0.5);
    border-radius: 2px;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 182, 212, 0.7);
  }
}

/* Responsive adjustments */
@media screen and (orientation: landscape) and (max-height: 600px) {
  /* For very short landscape screens */
  .max-h-\[80vh\] {
    max-height: 90vh !important;
  }
}
</style>
