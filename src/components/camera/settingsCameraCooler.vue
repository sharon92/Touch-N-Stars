<template>
  <div class="flex flex-col items-center gap-2">
    <div v-if="store.cameraInfo.CanSetTemperature" class="w-full">
      <div class="flex flex-col border border-slate-600/40 p-3 rounded-lg min-w-36">
        <!-- Cooler Status Indicator - ganz oben -->
        <div
          class="flex items-center justify-center gap-2 px-3 py-2 mb-3 rounded-lg"
          :class="{
            'bg-slate-700/40': cameraStore.coolerStatus === 'off',
            'bg-blue-600/20 border border-blue-500/40': cameraStore.coolerStatus === 'cooling',
            'bg-green-600/20 border border-green-500/40': cameraStore.coolerStatus === 'holding',
            'bg-orange-600/20 border border-orange-500/40': cameraStore.coolerStatus === 'warming',
          }"
        >
          <span class="text-xs text-gray-300 font-medium">
            {{ $t('components.camera.cooler_status') }}:
          </span>
          <span
            class="text-xs font-semibold"
            :class="{
              'text-gray-400': cameraStore.coolerStatus === 'off',
              'text-blue-400': cameraStore.coolerStatus === 'cooling',
              'text-green-400': cameraStore.coolerStatus === 'holding',
              'text-orange-400': cameraStore.coolerStatus === 'warming',
            }"
          >
            {{ coolerStatusText }}
          </span>
        </div>

        <div class="border-t border-slate-600/40 mb-3"></div>

        <div
          class="flex items-center justify-between mb-2 border border-gray-500 p-1 md:p-2 rounded-lg"
        >
          <label for="Cooler" class="text-xs md:text-sm text-gray-200 font-medium">
            {{ $t('components.camera.camera_cooling') }}
          </label>
          <toggleButton
            @click="cameraStore.toggleCooling"
            :status-value="cameraStore.buttonCoolerOn"
            class="h-7 md:h-8"
          />
        </div>
        <div class="flex flex-col justify-between sm:flex-row gap-2">
          <NumberInputPicker
            class="border border-gray-500 p-1 md:p-2 rounded-lg"
            v-model="cameraStore.coolingTemp"
            :label="$t('components.camera.target_temperature')"
            labelKey="components.camera.target_temperature"
            :min="-50"
            :max="30"
            :step="1"
            :decimalPlaces="0"
            placeholder="-10"
            inputId="TemperatureSetPoint"
            wrapperClass="sm:flex-1 col-span-2"
            @change="cameraStore.setCoolingTemp"
          />

          <NumberInputPicker
            class="border border-gray-500 p-1 md:p-2 rounded-lg"
            v-model="cameraStore.coolingTime"
            :label="$t('components.camera.cooling_time')"
            labelKey="components.camera.cooling_time"
            :min="0"
            :max="300"
            :step="1"
            :decimalPlaces="0"
            placeholder="1"
            inputId="CoolingDurationTime"
            wrapperClass="sm:flex-1 col-span-2"
            @change="cameraStore.setCoolingTime"
          />
        </div>
        <div class="border-t border-slate-600/40 my-4"></div>

        <div
          class="flex items-center justify-between mb-2 border border-gray-500 p-1 md:p-2 rounded-lg"
        >
          <label for="Cooler" class="text-xs md:text-sm text-gray-200 font-medium">
            {{ $t('components.camera.camera_warming') }}
          </label>
          <toggleButton
            @click="cameraStore.toggleWarming"
            :status-value="cameraStore.buttonWarmingOn"
            class="h-7 md:h-8"
          />
        </div>
        <div class="flex flex-col justify-between sm:flex-row gap-2">
          <NumberInputPicker
            class="border border-gray-500 p-1 md:p-2 rounded-lg"
            v-model="cameraStore.warmingTime"
            :label="$t('components.camera.warm_up_time')"
            labelKey="components.camera.warm_up_time"
            :min="0"
            :max="300"
            :step="1"
            :decimalPlaces="0"
            inputId="WarmingDurationTime"
            wrapperClass="w-full sm:w-1/2"
            @change="cameraStore.setWarmingTime"
          />
        </div>
      </div>
    </div>
    <div v-if="store.cameraInfo.HasDewHeater" class="w-full">
      <div class="flex flex-col border border-slate-600/40 p-3 rounded-lg">
        <div class="flex items-center justify-between border border-gray-500 p-1 md:p-2 rounded-lg">
          <label for="DewHeater" class="text-xs md:text-sm text-gray-200 font-medium">
            {{ $t('components.camera.dew_heater') }}
          </label>
          <toggleButton
            @click="cameraStore.toggleDewHeater"
            :status-value="store.cameraInfo.DewHeaterOn"
            class="h-7 md:h-8"
          />
        </div>
        <pinsSetDewHeaterStrength v-if="store.isPINS" class="mt-2" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiStore } from '@/store/store';
import { useCameraStore } from '@/store/cameraStore';
import toggleButton from '@/components/helpers/toggleButton.vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import pinsSetDewHeaterStrength from './settingsPins/pinsSetDewHeaterStrength.vue';

const store = apiStore();
const cameraStore = useCameraStore();
const { t } = useI18n();

const coolerStatusText = computed(() => {
  const currentTemp = Math.round(store.cameraInfo.Temperature);
  const targetTemp = Math.round(store.cameraInfo.TemperatureSetPoint);

  switch (cameraStore.coolerStatus) {
    case 'off':
      return t('components.camera.cooler_status_off');
    case 'cooling':
      return `${t('components.camera.cooler_status_cooling')} ${targetTemp}°C`;
    case 'holding':
      return `${t('components.camera.cooler_status_holding')} (${currentTemp}°C)`;
    case 'warming':
      return `${t('components.camera.cooler_status_warming')} ${targetTemp}°C`;
    default:
      return t('components.camera.cooler_status_off');
  }
});
</script>
