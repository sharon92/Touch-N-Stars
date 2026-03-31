<template>
  <div class="flex flex-col bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden">
    <!-- Header Button -->
    <button
      @click="toggleControls"
      class="flex items-center gap-2 px-3 py-2 h-8 text-sm font-semibold text-gray-200 hover:bg-gray-700/50 transition-colors w-full text-left"
    >
      <ChevronRightIcon
        class="w-4 h-4 flex-shrink-0 transition-transform duration-200"
        :class="{ 'rotate-90': isControlsOpen }"
      />
      <Cog6ToothIcon class="w-4 h-4 flex-shrink-0" />
      <span>{{ $t('components.sequence.graphControls.title') }}</span>
    </button>

    <!-- Collapsible Controls Section -->
    <transition name="slide-fade">
      <div v-if="isControlsOpen" class="flex flex-col gap-3 p-3 border-t border-gray-700/50">
        <!-- Time Display -->
        <div class="flex justify-between items-center text-xs text-gray-400">
          <span>{{ formatTime(currentStartIndex) }}</span>
          <span>{{ formatTime(currentEndIndexValue) }}</span>
        </div>

        <!-- Range Slider Bar mit zwei Griffen -->
        <div v-if="dataLength > 0" class="flex flex-col gap-3">
          <!-- Dual Range Slider -->
          <div class="relative pt-2 pb-2">
            <!-- Background Track -->
            <div
              class="absolute top-1/2 left-0 right-0 h-1 bg-gray-700 rounded-full -translate-y-1/2"
            ></div>

            <!-- Highlight Track (selected range) -->
            <div
              class="absolute top-1/2 h-1 bg-cyan-800 rounded-full pointer-events-none -translate-y-1/2"
              :style="{
                left: dataLength > 1 ? `${(currentStartIndex / (dataLength - 1)) * 100}%` : '0%',
                right:
                  dataLength > 1
                    ? `${((dataLength - 1 - currentEndIndexValue) / (dataLength - 1)) * 100}%`
                    : '0%',
              }"
            ></div>

            <!-- Start Thumb (visual only) -->
            <div
              class="absolute top-1/2 w-2 rounded-md h-6 bg-cyan-500 -translate-y-1/2 -translate-x-1/2 pointer-events-none shadow-lg"
              :style="{
                left: dataLength > 1 ? `${(currentStartIndex / (dataLength - 1)) * 100}%` : '0%',
              }"
            ></div>

            <!-- End Thumb (visual only) -->
            <div
              class="absolute top-1/2 w-2 rounded-md h-6 bg-cyan-500 -translate-y-1/2 -translate-x-1/2 pointer-events-none shadow-lg"
              :style="{
                left: dataLength > 1 ? `${(currentEndIndexValue / (dataLength - 1)) * 100}%` : '0%',
              }"
            ></div>

            <!-- Start Slider (invisible, for input) -->
            <input
              type="range"
              min="0"
              :max="dataLength - 1"
              :value="currentStartIndex"
              @input="updateStartIndex"
              class="absolute w-full top-1/2 -translate-y-1/2 h-8 appearance-none bg-transparent rounded-full cursor-pointer slider-input"
              style="z-index: 5"
            />

            <!-- End Slider (invisible, for input) -->
            <input
              type="range"
              min="0"
              :max="dataLength - 1"
              :value="currentEndIndexValue"
              @input="updateEndIndex"
              class="absolute w-full top-1/2 -translate-y-1/2 h-8 appearance-none bg-transparent rounded-full cursor-pointer slider-input"
              style="z-index: 4"
            />
          </div>

          <!-- Reset Button -->
          <button
            v-if="currentStartIndex !== 0 || currentEndIndex !== null"
            @click="resetTimeRange"
            class="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-all duration-150"
          >
            {{ $t('components.sequence.graphControls.reset') }}
          </button>
        </div>

        <div v-else class="text-xs text-gray-500">
          {{ $t('components.sequence.graphControls.noDataAvailable') }}
        </div>

        <!-- Divider -->
        <div class="border-t border-gray-700/50"></div>

        <!-- Data Source Selector -->
        <div class="flex flex-col gap-2">
          <div class="text-xs text-gray-300 font-semibold">
            {{ $t('components.sequence.graphControls.dataSources') }}
          </div>
          <div class="grid grid-cols-2 gap-3">
            <!-- First Data Source -->
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-400">{{
                $t('components.sequence.graphControls.source1')
              }}</label>
              <select
                :value="dataSource1"
                @change="updateDataSource1"
                class="w-full px-2 py-1 text-sm bg-gray-700 text-gray-300 border border-gray-600 rounded hover:bg-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option v-for="source in availableSources" :key="source" :value="source">
                  {{ source }}
                </option>
              </select>
            </div>

            <!-- Second Data Source -->
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-400">{{
                $t('components.sequence.graphControls.source2')
              }}</label>
              <select
                :value="dataSource2"
                @change="updateDataSource2"
                class="w-full px-2 py-1 text-sm bg-gray-700 text-gray-300 border border-gray-600 rounded hover:bg-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option v-for="source in availableSources" :key="source" :value="source">
                  {{ source }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { ChevronRightIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline';
import { useSettingsStore } from '@/store/settingsStore';
import { apiStore } from '@/store/store';
import { getFilteredImageHistory } from '@/composables/useVisibleImageHistory';

const settingsStore = useSettingsStore();
const apiStoreInstance = apiStore();

const isControlsOpen = ref(false);

const availableSources = [
  'Stars',
  'HFR',
  'Median',
  'Mean',
  'StDev',
  'Min',
  'Max',
  'Temperature',
  'HFRStDev',
  'RMS',
];

const filteredImages = computed(() =>
  getFilteredImageHistory(
    apiStoreInstance.imageHistoryInfo || [],
    settingsStore.monitorViewSetting.imageFilter
  )
);

const dataLength = computed(() => filteredImages.value.length);

const currentStartIndex = computed(
  () => settingsStore.monitorViewSetting.historyTimeRange.startIndex
);

const currentEndIndex = computed(() => settingsStore.monitorViewSetting.historyTimeRange.endIndex);

const currentEndIndexValue = computed(() =>
  currentEndIndex.value !== null ? currentEndIndex.value : Math.max(dataLength.value - 1, 0)
);

const dataSource1 = computed(() => settingsStore.monitorViewSetting.graphDataSource1);
const dataSource2 = computed(() => settingsStore.monitorViewSetting.graphDataSource2);

function updateStartIndex(event) {
  const newStart = parseInt(event.target.value, 10);
  // Wenn Start über End geht, swap sie
  if (newStart > currentEndIndexValue.value) {
    settingsStore.setHistoryTimeRange(currentEndIndexValue.value, newStart);
  } else {
    settingsStore.setHistoryTimeRange(newStart, currentEndIndex.value);
  }
}

function updateEndIndex(event) {
  const newEnd = parseInt(event.target.value, 10);
  // Wenn End unter Start geht, swap sie
  if (newEnd < currentStartIndex.value) {
    settingsStore.setHistoryTimeRange(newEnd, currentStartIndex.value);
  } else {
    settingsStore.setHistoryTimeRange(currentStartIndex.value, newEnd);
  }
}

function resetTimeRange() {
  settingsStore.resetHistoryTimeRange();
}

function formatTime(index) {
  const allData = filteredImages.value;
  if (index >= 0 && index < allData.length) {
    return new Date(allData[index].Date).toLocaleTimeString();
  }
  return '';
}

function toggleControls() {
  isControlsOpen.value = !isControlsOpen.value;
}

function updateDataSource1(event) {
  settingsStore.setGraphDataSource1(event.target.value);
}

function updateDataSource2(event) {
  settingsStore.setGraphDataSource2(event.target.value);
}
</script>

<style scoped>
/* Custom dual range slider styling */
.slider-input {
  -webkit-appearance: none;
  appearance: none;
  pointer-events: none;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  pointer-events: all;
}

.slider-input::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  border: none;
  pointer-events: all;
}

/* Remove default track styling */
.slider-input::-webkit-slider-runnable-track {
  background: transparent;
  height: 8px;
  border: none;
}

.slider-input::-moz-range-track {
  background: transparent;
  border: none;
}

.slider-input::-moz-range-progress {
  background: transparent;
}

/* Transition animations */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from {
  max-height: 0;
  opacity: 0;
}

.slide-fade-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
