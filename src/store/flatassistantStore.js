import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useToastStore } from '@/store/toastStore';
import i18n from '@/i18n';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const useFlatassistantStore = defineStore('flatassistantStore', {
  state: () => ({
    count: 20,
    darkCount: 0,
    ExposureTime: 2,
    minExposureTime: 0.01,
    maxExposureTime: 20,
    brightness: 100,
    minBrightness: 0,
    maxBrightness: 32000,
    histogramMean: 50,
    meanTolerance: 10,
    binning: '1x1',
    gain: 100,
    offset: 0,
    status: {
      State: '',
      TotalIterations: 0,
      CompletedIterations: -1,
      TotalFilters: 0,
      CompletedFilters: -1,
    },
    // Summary of the most recently completed run; null when no run has finished yet.
    // { type: 'flats'|'darks', completed: number, total: number, success: boolean, lastADU: number|null }
    lastRun: null,
    // ADU (Mean) of the most recently captured image during the current run
    currentADU: null,
    currentRunType: 'flats',
    workflowStopRequested: false,
    intervalId: null,
  }),
  actions: {
    async fetchFlatsInfos() {
      try {
        const store = apiStore();

        if (!store.isBackendReachable) {
          console.warn('Backend is not reachable flats');
          return;
        }

        const prevState = this.status.State;
        const prevCompleted = this.status.CompletedIterations;
        const prevTotal = this.status.TotalIterations;

        // Check both TNS (multimode) and ninaAPI status in parallel.
        // TNS takes precedence when its task is running.
        const [tnsResult, ninaResult] = await Promise.allSettled([
          apiService.flatMultiStatus(),
          apiService.flatassistantAction('status'),
        ]);

        const tnsNext = tnsResult.status === 'fulfilled' ? tnsResult.value?.Response : null;
        const ninaNext = ninaResult.status === 'fulfilled' ? ninaResult.value?.Response : null;
        const next = tnsNext?.State === 'Running' ? tnsNext : (ninaNext ?? tnsNext ?? this.status);

        // A new run is starting — clear the previous result
        if (prevState !== 'Running' && next.State === 'Running') {
          this.lastRun = null;
          this.currentADU = null;
        }

        // ADU comes directly from the flat status response (both Running and Finished states)
        if (next.CurrentADU !== null && next.CurrentADU !== undefined) {
          this.currentADU = Math.round(next.CurrentADU);
        }

        // A run just finished — save a summary so the UI can show the outcome
        if (prevState === 'Running' && next.State === 'Finished') {
          this.lastRun = {
            type: this.currentRunType,
            completed: prevCompleted,
            total: prevTotal,
            success: prevTotal > 0 && prevCompleted >= prevTotal,
            lastADU: this.currentADU,
          };
        }

        this.status = next;
      } catch (error) {
        console.error('Error fetching information:', error);
      }
    },

    startManagedRun(type = 'flats') {
      this.currentRunType = type;
      this.workflowStopRequested = false;
      this.lastRun = null;
      this.currentADU = null;
    },

    didRunSucceed(status) {
      return (
        status?.State === 'Finished' &&
        Number(status?.TotalIterations) > 0 &&
        Number(status?.CompletedIterations) >= Number(status?.TotalIterations)
      );
    },

    resolveCompletionProgress(status, progress = null) {
      const fallbackCompleted = Math.max(
        0,
        Number(progress?.completed ?? this.status?.CompletedIterations) || 0
      );
      const fallbackTotal = Math.max(
        0,
        Number(progress?.total ?? this.status?.TotalIterations) || 0
      );
      const completed = Number(status?.CompletedIterations);
      const total = Number(status?.TotalIterations);
      const resolvedCompleted = completed >= 0 ? completed : fallbackCompleted;
      const resolvedTotal = total > 0 ? total : fallbackTotal;
      const shouldPromoteCompleted =
        !this.workflowStopRequested &&
        status?.State === 'Finished' &&
        completed < 0 &&
        total <= 0 &&
        resolvedTotal > 0 &&
        resolvedCompleted > 0 &&
        resolvedCompleted + 1 === resolvedTotal;

      return {
        ...status,
        CompletedIterations: shouldPromoteCompleted ? resolvedTotal : resolvedCompleted,
        TotalIterations: resolvedTotal,
      };
    },

    shouldOfferDarks(status, jobs = null) {
      const requestedDarks = Array.isArray(jobs)
        ? jobs.some((job) => Number(job?.count) > 0)
        : this.darkCount > 0;

      return requestedDarks && this.didRunSucceed(status) && !this.workflowStopRequested;
    },

    formatOperationMessage(payload) {
      if (typeof payload?.Response === 'string' && payload.Response.trim()) {
        return payload.Response;
      }
      if (typeof payload?.Message === 'string' && payload.Message.trim()) {
        return payload.Message;
      }
      if (typeof payload?.message === 'string' && payload.message.trim()) {
        return payload.message;
      }
      if (typeof payload?.Error === 'string' && payload.Error.trim()) {
        return payload.Error;
      }
      return i18n.global.t('components.flatassistant.operation_failed');
    },

    notifyOperationIssue(payload, type = 'error') {
      useToastStore().showToast({
        type,
        title: i18n.global.t('components.flatassistant.operation_failed'),
        message: this.formatOperationMessage(payload),
        autoClose: true,
        autoCloseDelay: 5000,
      });
    },

    async waitForCompletion(statusLoader, pollMs = 1000) {
      const observedProgress = {
        completed: Math.max(0, Number(this.status?.CompletedIterations) || 0),
        total: Math.max(0, Number(this.status?.TotalIterations) || 0),
      };

      while (!this.workflowStopRequested) {
        const response = await statusLoader();
        const status = response?.Response ?? response;

        if (status) {
          if (Number(status.CompletedIterations) >= 0) {
            observedProgress.completed = Math.max(
              observedProgress.completed,
              Number(status.CompletedIterations) || 0
            );
          }

          if (Number(status.TotalIterations) > 0) {
            observedProgress.total = Math.max(
              observedProgress.total,
              Number(status.TotalIterations) || 0
            );
          }

          const resolvedStatus =
            status.State === 'Running'
              ? status
              : this.resolveCompletionProgress(status, observedProgress);

          this.status = resolvedStatus;

          if (status.CurrentADU !== null && status.CurrentADU !== undefined) {
            this.currentADU = Math.round(status.CurrentADU);
          }

          if (status.State !== 'Running') {
            this.lastRun = {
              type: this.currentRunType,
              completed: Math.max(0, Number(resolvedStatus.CompletedIterations) || 0),
              total: Math.max(0, Number(resolvedStatus.TotalIterations) || 0),
              success: this.didRunSucceed(resolvedStatus),
              lastADU: this.currentADU,
            };
            return resolvedStatus;
          }
        }

        await wait(pollMs);
      }

      return this.status;
    },

    async runFlatWorkflow({
      request,
      statusLoader = () => apiService.flatassistantAction('status'),
      darkJobs = [],
      keepClosed = false,
    }) {
      this.startManagedRun('flats');

      const response = await request();
      if (response?.Success === false) {
        this.notifyOperationIssue(response, 'warning');
        return null;
      }

      const finalStatus = await this.waitForCompletion(statusLoader);

      if (darkJobs.length > 0 && this.shouldOfferDarks(finalStatus, darkJobs)) {
        await this.runDarkSeries(darkJobs, keepClosed);
      }

      return finalStatus;
    },

    async stopWorkflow() {
      this.workflowStopRequested = true;
      return Promise.allSettled([
        apiService.flatassistantAction('stop'),
        apiService.flatMultiStop(),
      ]);
    },

    async runDarkSeries(jobs, keepClosed = false) {
      const validJobs = jobs.filter((job) => Number(job?.count) > 0);
      if (!validJobs.length || this.workflowStopRequested) {
        return null;
      }

      const confirmed = await useToastStore().showConfirmation(
        i18n.global.t('components.flatassistant.cover_scope_title'),
        i18n.global.t('components.flatassistant.cover_scope_message'),
        i18n.global.t('components.flatassistant.cover_scope_confirm'),
        i18n.global.t('common.cancel')
      );

      if (!confirmed) {
        return null;
      }

      let totalRequested = 0;
      let totalCompleted = 0;
      let allSucceeded = true;
      let lastADU = this.currentADU;

      for (const job of validJobs) {
        if (this.workflowStopRequested) {
          break;
        }

        totalRequested += Number(job.count) || 0;
        this.startManagedRun('darks');

        const response = await apiService.flatTrainedDarkFlat(
          job.count,
          job.binning,
          job.gain,
          job.offset,
          job.filterId,
          keepClosed
        );

        if (response?.Success === false) {
          allSucceeded = false;
          this.notifyOperationIssue(response, 'warning');
          continue;
        }

        const finalStatus = await this.waitForCompletion(() =>
          apiService.flatassistantAction('status')
        );

        totalCompleted += Math.max(0, Number(finalStatus?.CompletedIterations) || 0);
        lastADU = this.currentADU;

        if (!this.didRunSucceed(finalStatus)) {
          allSucceeded = false;
        }
      }

      if (totalRequested > 0) {
        this.lastRun = {
          type: 'darks',
          completed: totalCompleted,
          total: totalRequested,
          success: allSucceeded && totalCompleted >= totalRequested,
          lastADU,
        };
      }

      return this.lastRun;
    },

    startFetchingFlats() {
      if (!this.intervalId) {
        console.log('startFetchingFlats ');
        this.intervalId = setInterval(this.fetchFlatsInfos, 1000);
      }
    },

    stopFetchingFlats() {
      if (this.intervalId) {
        console.log('stopFetchingFlats ');
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },
  },
});
