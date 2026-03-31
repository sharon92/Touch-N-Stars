<template>
  <div>
    <div v-show="isLoading" class="flex items-center justify-center">
      <span
        class="w-12 h-12 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin"
      ></span>
    </div>
    <div v-show="!isLoading" class="w-full h-[25vh] min-h-40 relative">
      <canvas ref="rmsGraph"></canvas>
      <div class="absolute right-0 top-0 z-10 flex gap-1">
        <button
          type="button"
          class="rounded-md border border-gray-600 bg-gray-800/90 p-1 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
          :aria-label="$t('components.guider.graph.clear')"
          :title="$t('components.guider.graph.clear')"
          @click="clearGuideGraph"
        >
          <XCircleIcon class="h-5 w-5" />
        </button>
        <button
          v-if="store.isPINS"
          @click="showSettings = !showSettings"
          class="rounded-md border border-gray-600 bg-gray-800/90 p-1 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
          :aria-label="$t('components.guider.settings')"
          :title="$t('components.guider.settings')"
        >
          <Cog6ToothIcon class="w-5 h-5" />
        </button>
      </div>
    </div>
    <div v-if="store.isPINS" v-show="showSettings" class="mt-2 p-3 bg-gray-800 rounded-lg">
      <Phd2GraphSettings />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import Chart from 'chart.js/auto';
import { useGuiderStore } from '@/store/guiderStore';
import { useI18n } from 'vue-i18n';
import { useToastStore } from '@/store/toastStore';
import { apiStore } from '@/store/store';
import Phd2GraphSettings from './PHD2/pins/Phd2GraphSettings.vue';
import { Cog6ToothIcon, XCircleIcon } from '@heroicons/vue/24/outline';

const { t } = useI18n();
const guiderStore = useGuiderStore();
const toastStore = useToastStore();
const store = apiStore();
const isLoading = ref(true);
const rmsGraph = ref(null);
const showSettings = ref(false);
let chart = null;

const ditherMarkerPlugin = {
  id: 'guide-dither-markers',
  afterDatasetsDraw(chartInstance) {
    const ditherDatasetIndex = 4;
    const ditherMeta = chartInstance.getDatasetMeta(ditherDatasetIndex);
    const { ctx, chartArea } = chartInstance;

    if (!ditherMeta?.data?.length || !chartArea) {
      return;
    }

    ctx.save();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    ditherMeta.data.forEach((point) => {
      if (!point || point.skip) {
        return;
      }

      ctx.beginPath();
      ctx.moveTo(point.x, chartArea.top);
      ctx.lineTo(point.x, chartArea.bottom);
      ctx.stroke();
    });

    ctx.restore();
  },
};

function getVisibleGuideSteps(steps) {
  if (!Array.isArray(steps)) {
    return [];
  }

  const clearMarker = guiderStore.clearedAfterStepId;

  if (clearMarker === null) {
    return steps;
  }

  const latestStepId = Number(steps.at(-1)?.Id);
  if (Number.isFinite(latestStepId) && latestStepId < clearMarker) {
    guiderStore.resetGuideGraphClear();
    return steps;
  }

  return steps.filter((step) => Number(step?.Id) > clearMarker);
}

function updateChartData(steps) {
  if (!chart || !Array.isArray(steps)) return;

  const size = guiderStore.chartInfo.HistorySize;
  const visibleSteps = getVisibleGuideSteps(steps).slice(-size);
  const raDist = Array(size).fill(null);
  const decDist = Array(size).fill(null);
  const raDur = Array(size).fill(null);
  const decDur = Array(size).fill(null);
  const dither = [];
  const labels = Array(size).fill('');

  let maxDuration = 0;

  visibleSteps.forEach((step, index) => {
    const ra = step.RADuration ?? 0;
    const dec = step.DECDuration ?? 0;

    raDist[index] = step.RADistanceRawDisplay ?? null;
    decDist[index] = step.DECDistanceRawDisplay ?? null;
    raDur[index] = ra;
    decDur[index] = dec;
    labels[index] = step.Id.toString();

    if (step.Dither && step.Dither !== 'NaN') {
      dither.push({ x: step.Id.toString(), y: 0 });
    }

    maxDuration = Math.max(maxDuration, Math.abs(ra), Math.abs(dec));
  });

  const maxAbs = Math.max(maxDuration, 100);

  chart.options.scales.y1.suggestedMin = -maxAbs;
  chart.options.scales.y1.suggestedMax = maxAbs;
  chart.options.scales.y.min = guiderStore.chartInfo.MinY;
  chart.options.scales.y.max = guiderStore.chartInfo.MaxY;

  chart.data.datasets[0].data = raDist;
  chart.data.datasets[1].data = decDist;
  chart.data.datasets[2].data = raDur;
  chart.data.datasets[3].data = decDur;
  chart.data.datasets[4].data = dither;
  chart.data.labels = labels;

  chart.update();
  isLoading.value = false;
}

function clearGuideGraph() {
  const latestStepId = guiderStore.chartInfo?.GuideSteps?.at(-1)?.Id;

  guiderStore.clearGuideGraph(latestStepId);
  updateChartData(guiderStore.chartInfo?.GuideSteps);
}

const initGraph = () => {
  const size = guiderStore.chartInfo.HistorySize;
  const ctx = rmsGraph.value.getContext('2d');

  chart = new Chart(ctx, {
    plugins: [ditherMarkerPlugin],
    type: 'bar',
    data: {
      labels: Array(size).fill(''),
      datasets: [
        {
          type: 'line',
          label: 'RA "',
          borderColor: 'rgba(70, 130, 180, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0,
          pointRadius: 0,
          data: Array(size).fill(null),
          yAxisID: 'y',
          order: 2,
        },
        {
          type: 'line',
          label: 'Dec "',
          borderColor: 'rgba(220, 20, 60, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          tension: 0,
          pointRadius: 0,
          data: Array(size).fill(null),
          yAxisID: 'y',
          order: 3,
        },
        {
          type: 'bar',
          label: 'RA Duration',
          backgroundColor: 'rgba(70, 130, 180, 0.4)',
          data: Array(size).fill(null),
          yAxisID: 'y1',
          order: 4,
        },
        {
          type: 'bar',
          label: 'Dec Duration',
          backgroundColor: 'rgba(220, 20, 60, 0.4)',
          data: Array(size).fill(null),
          yAxisID: 'y1',
          order: 5,
        },
        {
          type: 'scatter',
          label: 'Dither',
          data: Array(size).fill(null),
          yAxisID: 'y',
          showLine: false,
          pointRadius: 8,
          pointStyle: 'triangle',
          backgroundColor: 'rgba(251, 191, 36, 1)',
          borderColor: 'rgba(245, 158, 11, 1)',
          borderWidth: 2,
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#CCCCCC',
          },
        },
        tooltip: {
          enabled: false,
        },
      },
      animation: {
        duration: 0,
      },
      scales: {
        x: {
          display: false,
        },
        y: {
          position: 'left',
          min: guiderStore.chartInfo.MinY,
          max: guiderStore.chartInfo.MaxY,
          grid: {
            color: 'rgba(248, 248, 255, 0.1)',
          },
          title: {
            display: true,
            color: '#CCCCCC',
            text: 'RA/Dec',
          },
          ticks: {
            color: '#e5e7eb', // <- Zahlen-Beschriftung auf Y-Achse
          },
        },
        y1: {
          position: 'right',
          stacked: false,
          grid: {
            drawOnChartArea: false,
          },
          title: {
            display: true,
            color: '#CCCCCC',
            text: 'Duration (ms)',
          },
          ticks: {
            color: '#e5e7eb', // <- Zahlen-Beschriftung auf Y-Achse
          },
        },
      },
    },
  });
};

// Überwachung der Store-Daten
watch(
  () => guiderStore.chartInfo.GuideSteps,
  (steps) => {
    if (!chart || !steps || !Array.isArray(steps)) return;

    updateChartData(steps);
  },
  { immediate: true }
);

watch(
  () => guiderStore.clearedAfterStepId,
  () => {
    updateChartData(guiderStore.chartInfo?.GuideSteps);
  }
);

watch(
  () => guiderStore.phd2StarLost,
  (newValue, oldValue) => {
    if (oldValue === undefined) return; // skip first run

    if (newValue === true && oldValue === false) {
      // Debounce: wait 1.5s before showing toast to avoid false positives when
      // PHD2 briefly emits StarLost immediately before GuidingStopped on a normal stop.
      setTimeout(() => {
        if (guiderStore.phd2StarLost) {
          toastStore.showToast({
            type: 'error',
            title: t('components.guider.phd2.error.title'),
            message: t('components.guider.phd2.error.star-lost-message'),
          });
        }
      }, 1500);
    }
  }
);

onMounted(async () => {
  await guiderStore.fetchGraphInfos(t);
  guiderStore.startFetching(t);
  initGraph();
});

onBeforeUnmount(() => {
  guiderStore.stopFetching();
  if (chart) {
    chart.destroy();
  }
});
</script>

<style scoped></style>
