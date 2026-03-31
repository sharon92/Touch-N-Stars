<template>
  <div
    v-if="store.isBackendReachable"
    class="w-full transition-opacity h-9 text-sm px-4 text-gray-400 flex items-center justify-between overflow-hidden safe-area-bottom"
    :class="[activeInstanceColor]"
  >
    <!-- Safety info -->
    <div v-if="store.safetyInfo.Connected" class="flex">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        :class="`w-5 h-5 ${store.safetyInfo.IsSafe ? 'text-green-600' : 'text-red-600'}`"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path
          d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3"
        />
        <path d="M12 11m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
        <path d="M12 12l0 2.5" />
      </svg>
    </div>
    <!--Camera-->
    <div v-if="store.cameraInfo.Connected" class="flex items-center gap-1">
      <button
        class="flex flex-row bg-cyan-950 p-1 shadow-lg rounded-full border border-cyan-800 gap-1"
        :class="[
          {
            'glow-green': cameraStore.showCameraInfo,
          },
        ]"
        @click="handleCameraClickWithVisit"
      >
        <div class="flex w-5 h-5">
          <CameraIcon :class="{ 'text-green-500': store.cameraInfo.IsExposing }" />
        </div>
        <p v-show="cameraStore.exposureCountdown">{{ cameraStore.exposureCountdown }} s</p>
        <p class="hidden xs:block">Gain: {{ Number(store.cameraInfo.Gain).toFixed(0) }}</p>
        <p v-if="store.cameraInfo.CoolerOn" class="hidden xs:flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-5 h-5 icon icon-tabler icons-tabler-outline icon-tabler-temperature"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M10 13.5a4 4 0 1 0 4 0v-8.5a2 2 0 0 0 -4 0v8.5" />
            <path d="M10 9l4 0" />
          </svg>

          {{ Number(store.cameraInfo.Temperature).toFixed(1) }}
        </p>
        <p v-if="store.cameraInfo.CoolerOn" class="hidden xs:block">
          ({{ Number(store.cameraInfo.CoolerPower).toFixed(0) }}%)
        </p>
      </button>
      <CameraCoolingToggleButton />
    </div>
    <!--Filter-->
    <button
      v-if="store.filterInfo.Connected"
      class="flex flex-row bg-cyan-950 p-1 shadow-lg rounded-full border border-cyan-800 gap-1"
      :class="[
        {
          'glow-green': filterStore.showFilterwheelInfo,
        },
      ]"
      @click="handleFilterClickWithVisit"
    >
      <p class="flex items-center">
        <svg
          class="w-5 h-5"
          baseProfile="full"
          version="1.1"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:ev="http://www.w3.org/2001/xml-events"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <defs />
          <circle cx="50.0" cy="50.0" fill="currentColor" r="40.0" stroke="black" />
          <circle cx="70.0" cy="50.0" fill="black" r="5.0" />
          <circle cx="56.180339887498945" cy="69.02113032590307" fill="black" r="5.0" />
          <circle cx="33.819660112501055" cy="61.75570504584947" fill="black" r="5.0" />
          <circle cx="33.81966011250105" cy="38.24429495415054" fill="black" r="5.0" />
          <circle cx="56.180339887498945" cy="30.978869674096927" fill="black" r="5.0" />
        </svg>
        {{ store.filterInfo.SelectedFilter?.Name || 'No Filter' }}
      </p>
    </button>
    <!--Mount-->
    <button
      v-if="store.mountInfo.Connected"
      class="flex flex-row bg-cyan-950 p-1 shadow-lg rounded-full border border-cyan-800 gap-1"
      :class="[
        {
          'glow-green': mountStore.showMountInfo,
        },
      ]"
      @click="handleMountClickWithVisit"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        :class="[
          'w-5 h-5 icon icon-tabler icons-tabler-outline icon-tabler-filters',
          store.mountInfo.AtPark
            ? 'text-red-500'
            : !store.mountInfo.TrackingEnabled
              ? 'text-yellow-500'
              : 'text-green-500',
        ]"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M6 21l6 -5l6 5" />
        <path d="M12 13v8" />
        <path
          d="M3.294 13.678l.166 .281c.52 .88 1.624 1.265 2.605 .91l14.242 -5.165a1.023 1.023 0 0 0 .565 -1.456l-2.62 -4.705a1.087 1.087 0 0 0 -1.447 -.42l-.056 .032l-12.694 7.618c-1.02 .613 -1.357 1.897 -.76 2.905z"
        />
        <path d="M14 5l3 5.5" />
      </svg>
      <div
        v-if="store.mountInfo.Slewing"
        class="w-4 h-4 border-2 border-green-500 border-t-transparent border-solid rounded-full animate-spin"
      ></div>
    </button>
    <!--Guider-->
    <div v-if="store.guiderInfo.Connected" class="flex items-center gap-1">
      <button
        class="flex flex-row bg-cyan-950 p-1 shadow-lg rounded-full border border-cyan-800 gap-1"
        :class="[
          {
            'glow-green': guiderStore.showGuiderGraph && !guiderStore.phd2StarLost,
            'glow-red': guiderStore.phd2StarLost,
          },
        ]"
        @click="handleGuiderClickWithVisit"
      >
        <svg
          class="w-5 h-5 icon icon-tabler icons-tabler-outline icon-tabler-viewfinder"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          :class="{ 'text-green-500': store.guiderInfo.State == 'Guiding' }"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
          <path d="M12 3l0 4" />
          <path d="M12 21l0 -3" />
          <path d="M3 12l4 0" />
          <path d="M21 12l-3 0" />
          <path d="M12 12l0 .01" />
        </svg>
        <p v-if="store.profileInfo?.GuiderSettings?.PHD2GuiderScale === 'ARCSECONDS'">
          {{ store.guiderInfo.RMSError?.Total.Arcseconds.toFixed(2) }}"
        </p>
        <p v-else>{{ store.guiderInfo.RMSError?.Total.Pixel.toFixed(2) }}</p>
      </button>
    </div>
    <!-- Weather info container -->
    <button
      v-if="store.weatherInfo.Connected"
      class="flex flex-row bg-cyan-950 p-1 shadow-lg rounded-full border border-cyan-800 gap-1"
      @click.stop.prevent="handleWeatherClick"
    >
      <svg
        v-if="Number.isFinite(store.weatherInfo.CloudCover) && store.weatherInfo.CloudCover < 20"
        class="w-4 h-4"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M6.05 4.14l-.39-.39a.993.993 0 0 0-1.4 0l-.01.01c-.39.39-.39 1.02 0 1.41l.39.39c.39.39 1.01.39 1.4 0l.01-.01c.39-.38.39-1.02 0-1.41zM3.01 10.5H1.99c-.55 0-.99.44-.99.99v.01c0 .55.44.99.99.99H3c.56.01 1-.43 1-.98v-.01c0-.56-.44-1-.99-1zm9-9.95H12c-.56 0-1 .44-1 .99v.96c0 .55.44.99.99.99H12c.56.01 1-.43 1-.98v-.97c0-.55-.44-.99-.99-.99zm7.74 3.21c-.39-.39-1.02-.39-1.41-.01l-.39.39a.996.996 0 0 0 0 1.41l.01.01c.39.39 1.02.39 1.4 0l.39-.39c.39-.39.39-1.02 0-1.41zm-1.81 15.1l.39.39a.996.996 0 1 0 1.41-1.41l-.39-.39a.996.996 0 0 0-1.41 1.41zm-2.83-9.9c0-.56-.44-1-.99-1H12c-.55 0-.99.44-.99.99v.01c0 .55.44.99.99.99h4.95c.56.01 1-.43 1-.98v-.01zm-9.95 9.95c.56 0 1-.44 1-.99v-.96c0-.55-.44-.99-.99-.99H12c-.56 0-1 .44-1 .99v.96c0 .56.44 1 .99 1h4.95zm12.45-8.45a.996.996 0 0 0 0-1.41L19.14 5.6a.996.996 0 0 0-1.41 0c-.39.39-.39 1.02 0 1.41l2.12 2.12c.39.39 1.02.39 1.41 0z"
        />
      </svg>
      <svg
        v-else-if="
          Number.isFinite(store.weatherInfo.CloudCover) && store.weatherInfo.CloudCover < 60
        "
        class="w-4 h-4"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M6.05 4.14l-.39-.39a.993.993 0 0 0-1.4 0l-.01.01c-.39.39-.39 1.02 0 1.41l.39.39c.39.39 1.01.39 1.4 0l.01-.01c.39-.38.39-1.02 0-1.41zM3.01 10.5H1.99c-.55 0-.99.44-.99.99v.01c0 .55.44.99.99.99H3c.56.01 1-.43 1-.98v-.01c0-.56-.44-1-.99-1zm9-9.95H12c-.56 0-1 .44-1 .99v.96c0 .55.44.99.99.99H12c.56.01 1-.43 1-.98v-.97c0-.55-.44-.99-.99-.99zm7.74 3.21c-.39-.39-1.02-.39-1.41-.01l-.39.39a.996.996 0 0 0 0 1.41l.01.01c.39.39 1.02.39 1.4 0l.39-.39c.39-.39.39-1.02 0-1.41zm-1.81 15.1l.39.39a.996.996 0 1 0 1.41-1.41l-.39-.39a.996.996 0 0 0-1.41 1.41zm-2.83-9.9c0-.56-.44-1-.99-1H12c-.55 0-.99.44-.99.99v.01c0 .55.44.99.99.99h4.95c.56.01 1-.43 1-.98v-.01zm-9.95 9.95c.56 0 1-.44 1-.99v-.96c0-.55-.44-.99-.99-.99H12c-.56 0-1 .44-1 .99v.96c0 .56.44 1 .99 1h4.95zm12.45-8.45a.996.996 0 0 0 0-1.41L19.14 5.6a.996.996 0 0 0-1.41 0c-.39.39-.39 1.02 0 1.41l2.12 2.12c.39.39 1.02.39 1.41 0z"
        />
        <path
          d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"
        />
      </svg>
      <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path
          d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"
        />
      </svg>
      <span class="text-sm"
        >{{
          Number.isFinite(store.weatherInfo.Temperature)
            ? store.weatherInfo.Temperature.toFixed(1)
            : '--'
        }}°C</span
      >
    </button>
    <!--Progress -->
    <button
      v-if="store.isPINS"
      class="flex flex-row bg-cyan-950 p-1 shadow-lg rounded-full border border-cyan-800 gap-1"
      :class="{
        'glow-green': showProgress,
      }"
      @click.stop.prevent="handleProgressClick"
    >
      <svg
        class="w-5 h-5"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M3 12h4l3 8l4 -16l3 8h4" />
      </svg>
    </button>
    <!--Log -->
    <div>
      <button
        class="flex flex-row bg-cyan-950 p-1 shadow-lg rounded-full border border-cyan-800 gap-1"
        @click.stop.prevent="handleLogClick"
      >
        <svg
          class="w-5 h-5"
          viewBox="0 0 512 512"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <title>log</title>
          <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
            <g id="log-white" fill="currentColor" transform="translate(85.572501, 42.666667)">
              <path
                d="M236.349632,7.10542736e-15 L1.68296533,7.10542736e-15 L1.68296533,234.666667 L44.349632,234.666667 L44.349632,192 L44.349632,169.6 L44.349632,42.6666667 L218.642965,42.6666667 L300.349632,124.373333 L300.349632,169.6 L300.349632,192 L300.349632,234.666667 L343.016299,234.666667 L343.016299,106.666667 L236.349632,7.10542736e-15 L236.349632,7.10542736e-15 Z M4.26325641e-14,405.333333 L4.26325641e-14,277.360521 L28.8096875,277.360521 L28.8096875,382.755208 L83.81,382.755208 L83.81,405.333333 L4.26325641e-14,405.333333 Z M153.17,275.102708 C173.279583,275.102708 188.692917,281.484792 199.41,294.248958 C209.705625,306.47125 214.853437,322.185625 214.853437,341.392083 C214.853437,362.404792 208.772396,379.112604 196.610312,391.515521 C186.134062,402.232604 171.653958,407.591146 153.17,407.591146 C133.060417,407.591146 117.647083,401.209062 106.93,388.444896 C96.634375,376.222604 91.4865625,360.267396 91.4865625,340.579271 C91.4865625,319.988021 97.5676042,303.490937 109.729687,291.088021 C120.266146,280.431146 134.74625,275.102708 153.17,275.102708 Z M153.079687,297.680833 C142.663646,297.680833 134.625833,302.015833 128.96625,310.685833 C123.848542,318.512917 121.289687,328.567708 121.289687,340.850208 C121.289687,355.059375 124.330208,366.0775 130.41125,373.904583 C136.131042,381.310208 143.717292,385.013021 153.17,385.013021 C163.525833,385.013021 171.59375,380.647917 177.37375,371.917708 C182.491458,364.211042 185.050312,354.035833 185.050312,341.392083 C185.050312,327.483958 182.009792,316.616354 175.92875,308.789271 C170.208958,301.383646 162.592604,297.680833 153.079687,297.680833 Z M343.91,333.715521 L343.91,399.011458 C336.564583,401.48 331.386667,403.105625 328.37625,403.888333 C319.043958,406.356875 309.019271,407.591146 298.302187,407.591146 C277.229271,407.591146 261.18375,402.292812 250.165625,391.696146 C237.943333,380.015729 231.832187,363.729375 231.832187,342.837083 C231.832187,318.813958 239.418437,300.69125 254.590937,288.468958 C265.609062,279.558125 280.480521,275.102708 299.205312,275.102708 C315.220729,275.102708 330.122292,278.022812 343.91,283.863021 L334.065937,306.350833 C327.563437,303.099583 321.87375,300.826719 316.996875,299.53224 C312.12,298.23776 306.761458,297.590521 300.92125,297.590521 C286.952917,297.590521 276.657292,302.13625 270.034375,311.227708 C264.435,318.934375 261.635312,329.079479 261.635312,341.663021 C261.635312,356.775312 265.849896,368.154687 274.279062,375.801146 C281.022396,381.942396 289.391354,385.013021 299.385937,385.013021 C305.226146,385.013021 310.765312,384.019583 316.003437,382.032708 L316.003437,356.293646 L293.967187,356.293646 L293.967187,333.715521 L343.91,333.715521 Z"
                id="XLS"
              ></path>
            </g>
          </g>
        </svg>
      </button>
    </div>
    <!--WS Status + Instance Switcher -->
    <button
      class="flex items-center gap-1 bg-cyan-950 p-1 shadow-lg rounded-full border border-cyan-800"
      @click.stop.prevent="showInstanceSwitcher = true"
    >
      <LinkIcon
        class="w-5 h-5"
        :class="{
          'text-green-500': store.isWebSocketConnected,
          'text-red-500': !store.isWebSocketConnected,
        }"
      />
      <span class="text-xs hidden xs:block pr-1">{{
        activeInstanceName.length > 5 ? activeInstanceName.slice(0, 5) + '…' : activeInstanceName
      }}</span>
    </button>

    <!-- Instance Switcher Modal -->
    <InstanceSwitcherModal v-if="showInstanceSwitcher" @close="showInstanceSwitcher = false" />

    <!-- Weather modal -->
    <WeatherModal
      v-if="showWeatherModal"
      :weatherInfo="store.weatherInfo"
      @close="showWeatherModal = false"
    />

    <!-- Log modal -->
    <LogModal v-if="showLogModal" @close="showLogModal = false" />
    <!-- Guidegraph -->
    <div
      class="bg-gray-800/95 border-t border-cyan-700"
      :class="guiderGraphClasses"
      style="bottom: calc(env(safe-area-inset-bottom, 0px) + 36px)"
      v-show="guiderStore.showGuiderGraph"
    >
      <GuiderGraph />
      <div class="flex gap-2 ml-6 mb-2">
        <GuiderStats />
      </div>
    </div>

    <div
      class="bg-gray-800/95 border-t border-cyan-700"
      :class="guiderGraphClasses"
      style="bottom: calc(env(safe-area-inset-bottom, 0px) + 36px)"
      v-show="cameraStore.showCameraInfo"
    >
      <infoCamera class="p-5" />
    </div>

    <div
      class="bg-gray-800/95 border-t border-cyan-700"
      :class="guiderGraphClasses"
      style="bottom: calc(env(safe-area-inset-bottom, 0px) + 36px)"
      v-show="mountStore.showMountInfo"
    >
      <infoMount class="p-5" />
    </div>

    <div
      class="bg-gray-800/95 border-t border-cyan-700"
      :class="guiderGraphClasses"
      style="bottom: calc(env(safe-area-inset-bottom, 0px) + 36px)"
      v-show="filterStore.showFilterwheelInfo"
    >
      <InfoFilterwheel class="p-5" />
    </div>

    <div
      v-if="store.isPINS"
      class="bg-gray-800/95 border-t border-cyan-700"
      :class="guiderGraphClasses"
      style="bottom: calc(env(safe-area-inset-bottom, 0px) + 36px)"
      v-show="showProgress"
    >
      <infoProgress class="" />
    </div>
  </div>
</template>

<script setup>
import { apiStore } from '@/store/store';
import { ref, computed } from 'vue';
import { CameraIcon, LinkIcon } from '@heroicons/vue/24/outline';
import WeatherModal from '../WeatherModal.vue';
import LogModal from './LogModal.vue';
import InstanceSwitcherModal from './InstanceSwitcherModal.vue';
import GuiderGraph from '../guider/GuiderGraph.vue';
import GuiderStats from '../guider/GuiderStats.vue';
import { useGuiderStore } from '@/store/guiderStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useCameraStore } from '@/store/cameraStore';
import { useMountStore } from '@/store/mountStore';
import { useFilterStore } from '@/store/filterStore';
import { useOrientation } from '@/composables/useOrientation';
import infoCamera from '../camera/infoCamera.vue';
import infoMount from '../mount/infoMount.vue';
import InfoFilterwheel from '../filterwheel/InfoFilterwheel.vue';
import infoProgress from './infoProgress.vue';
import CameraCoolingToggleButton from './CameraCoolingToggleButton.vue';

const store = apiStore();
const showWeatherModal = ref(false);
const showLogModal = ref(false);
const showInstanceSwitcher = ref(false);
const showProgress = ref(false);
const guiderStore = useGuiderStore();
const settingsStore = useSettingsStore();
const cameraStore = useCameraStore();
const mountStore = useMountStore();
const filterStore = useFilterStore();
const showStatusBarPulse = ref(false);
const selectedInstanceId = computed(() => settingsStore.selectedInstanceId);

const checkStatusBarFeatureHighlight = () => {
  const hasVisited = settingsStore.tutorial?.statusBarButtonsVisited === true;
  showStatusBarPulse.value = !hasVisited;
};

const markStatusBarAsVisited = () => {
  settingsStore.tutorial.statusBarButtonsVisited = true;
  showStatusBarPulse.value = false;
};

const handleCameraClickWithVisit = () => {
  handleCameraClick();
  markStatusBarAsVisited();
};

const handleFilterClickWithVisit = () => {
  handleFilterClick();
  markStatusBarAsVisited();
};

const handleMountClickWithVisit = () => {
  handleMountClick();
  markStatusBarAsVisited();
};

const handleGuiderClickWithVisit = () => {
  handleGuiderClick();
  markStatusBarAsVisited();
};

const activeInstanceColor = computed(() => {
  const color = settingsStore.getInstanceColorById(selectedInstanceId.value);
  return color;
});

const activeInstanceName = computed(() => {
  return settingsStore.getInstance(selectedInstanceId.value)?.name ?? '';
});

// Initialize feature highlight on mount
checkStatusBarFeatureHighlight();

// Check if in landscape mode
const { isLandscape } = useOrientation();
const guiderGraphClasses = computed(() => ({
  'fixed left-0 w-full': !isLandscape.value,
  'fixed left-32 right-0': isLandscape.value,
}));

function handleWeatherClick(event) {
  showWeatherModal.value = true;
  event.stopPropagation();
  event.preventDefault();
}

function handleLogClick(event) {
  showLogModal.value = true;
  event.stopPropagation();
  event.preventDefault();
}

function handleCameraClick() {
  cameraStore.showCameraInfo = !cameraStore.showCameraInfo;
  if (cameraStore.showCameraInfo) {
    guiderStore.showGuiderGraph = false;
    mountStore.showMountInfo = false;
    filterStore.showFilterwheelInfo = false;
    showProgress.value = false;
  }
}

function handleGuiderClick() {
  guiderStore.showGuiderGraph = !guiderStore.showGuiderGraph;
  if (guiderStore.showGuiderGraph) {
    cameraStore.showCameraInfo = false;
    mountStore.showMountInfo = false;
    filterStore.showFilterwheelInfo = false;
    showProgress.value = false;
  }
}

function handleMountClick() {
  mountStore.showMountInfo = !mountStore.showMountInfo;
  if (mountStore.showMountInfo) {
    cameraStore.showCameraInfo = false;
    guiderStore.showGuiderGraph = false;
    filterStore.showFilterwheelInfo = false;
    showProgress.value = false;
  }
}

function handleFilterClick() {
  filterStore.showFilterwheelInfo = !filterStore.showFilterwheelInfo;
  if (filterStore.showFilterwheelInfo) {
    cameraStore.showCameraInfo = false;
    guiderStore.showGuiderGraph = false;
    mountStore.showMountInfo = false;
    showProgress.value = false;
  }
}

function handleProgressClick() {
  showProgress.value = !showProgress.value;
  if (showProgress.value) {
    cameraStore.showCameraInfo = false;
    guiderStore.showGuiderGraph = false;
    mountStore.showMountInfo = false;
    filterStore.showFilterwheelInfo = false;
  }
}
</script>

<style scoped>
.safe-area-bottom {
  /* Add safe area padding for iOS devices */
  padding-bottom: env(safe-area-inset-bottom);
  /* Ensure minimum height is maintained */
  min-height: calc(2.25rem + env(safe-area-inset-bottom)); /* 36px (h-9) + safe area */

  /* Ensure content is properly centered when safe area is applied */
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

/* For devices without safe area support, fallback to normal padding */
@supports not (padding-bottom: env(safe-area-inset-bottom)) {
  .safe-area-bottom {
    padding-bottom: 0.5rem; /* Add some padding for non-iOS devices */
    min-height: calc(2.25rem + 0.5rem); /* h-9 equivalent + padding */
  }
}

/* Specific handling for iOS devices with curved screens */
@media screen and (max-device-width: 428px) and (-webkit-device-pixel-ratio: 3) {
  .safe-area-bottom {
    padding-bottom: max(env(safe-area-inset-bottom), 0.75rem);
    min-height: calc(2.25rem + max(env(safe-area-inset-bottom), 0.75rem));
  }
}

/* Ensure buttons and icons are properly spaced */
.safe-area-bottom button {
  margin-bottom: 0;
  z-index: 1;
}

/* Prevent content from being cut off on curved screens */
.safe-area-bottom > * {
  margin-bottom: 0;
  flex-shrink: 0;
}
</style>
