import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import apiPinsService from '@/services/apiPinsService';
import { apiStore } from '@/store/store';

export const useGuiderStore = defineStore('guiderStore', {
  state: () => ({
    guidecamOk: false,
    intervalId: null,
    RADistanceRaw: [],
    DECDistanceRaw: [],
    raDuration: [],
    decDuration: [],
    chartInfo: [],
    showGuiderGraph: false,
    clearedAfterStepId: null,

    phd2Connection: [],
    phd2Status: [],
    phd2StarLostInfo: [],
    phd2StarLost: false,
    isFetchingPhd2Infos: false,
    phd2EquipmentProfiles: [],
    phd2CurrentEquipment: [],
    phd2IsConnected: false,
    phd2StarInfo: null,
    phd2CalibrationMessage: null,

    // PHD2 Camera State (PINS)
    phd2Cameras: [],
    phd2SelectedCameraIndex: null,
    phd2SelectedCameraName: null,
    phd2CamerasLoading: false,

    // PHD2 Mount State (PINS)
    phd2Mounts: [],
    phd2SelectedMountIndex: null,
    phd2SelectedMountName: null,
    phd2MountsLoading: false,

    // PHD2 Focal Length State (PINS)
    phd2FocalLength: null,
    phd2FocalLengthLoading: false,

    // PHD2 Calibration Step State (PINS)
    phd2CalibrationStep: null,
    phd2CalibrationStepLoading: false,

    // PHD2 Reverse DEC After Flip State (PINS)
    phd2ReverseDecAfterFlip: false,
    phd2ReverseDecAfterFlipLoading: false,

    // PHD2 Guide Algorithm RA State (PINS)
    phd2GuideAlgorithmRA: null,
    phd2GuideAlgorithmRALoading: false,

    // PHD2 Guide Algorithm DEC State (PINS)
    phd2GuideAlgorithmDEC: null,
    phd2GuideAlgorithmDECLoading: false,
  }),
  actions: {
    async fetchGraphInfos() {
      const store = apiStore();
      try {
        if (!store.isBackendReachable) {
          console.warn('Backend is not reachable log');
          return;
        }
        //Graphdaten vom Backend holen
        const response = await apiService.guiderAction('graph');
        this.chartInfo = response.Response;
      } catch (error) {
        console.error('Error fetching the information:', error);
      }
      if (store.guiderInfo?.DeviceId === 'PHD2_Single' && store.isBackendReachable) {
        this.fetchPhd2Infos();
      }
    },

    async fetchPhd2Infos() {
      if (this.isFetchingPhd2Infos) {
        return;
      }

      this.isFetchingPhd2Infos = true;
      try {
        const response1 = await apiService.getPhd2AllInfos();

        this.phd2Connection = response1.Response?.Connection;

        if (!this.phd2Connection.IsConnected) {
          await apiService.connectPHD2();
          return;
        }
        const response2 = await apiService.getPhd2CurrentEquipment();

        this.phd2Status = response1.Response.Status;
        //console.log('appstate' , response1.Response.Status);

        this.phd2StarLostInfo = response1.Response.StarLostInfo;

        const mainStore = apiStore();
        const phd2AppState = response1.Response.Status?.AppState;

        // Only flag star lost if PHD2 itself says LostLock — not during a normal stop
        // (PHD2 briefly emits StarLost before GuidingStopped when stopping intentionally)
        this.phd2StarLost =
          phd2AppState === 'LostLock' &&
          this.checkStarLostByState(phd2AppState, mainStore.guiderInfo?.State);
        if (this.phd2StarLost) {
          console.log('Star lost');
          console.log(this.phd2StarLostInfo);

          // Prüfe, ob die Seite kürzlich aus dem Hintergrund zurückgekehrt ist
          if (!mainStore.isPageRecentlyReturnedFromBackground()) {
            console.log('Show star lost toast');
          } else {
            console.log('Page recently returned from background, skipping star lost toast');
          }
        }

        this.phd2EquipmentProfiles = response1.Response.EquipmentProfiles;

        // Calibration step message from PHD2 Calibrating events
        const calStep = response1.Response.Status?.CalibrationStep;
        this.phd2CalibrationMessage = calStep?.Message || null;

        // Show star profile only when get_star_image succeeded (StarImage.Available = true),
        // which means PHD2 actually has a star selected/tracked right now.
        // Use top-level StarInfo (direct from CurrentStar events) as it's more up-to-date;
        // fall back to StarImage.StarInfo. Only show when Available=true (star actively tracked).
        const starImageInfo = response1.Response.StarImage;
        const topLevelStarInfo = response1.Response.StarInfo;
        this.phd2StarInfo = starImageInfo?.Available
          ? topLevelStarInfo || starImageInfo?.StarInfo || null
          : null;

        this.phd2CurrentEquipment = response2.Response.CurrentEquipment;
        this.phd2IsConnected =
          this.phd2CurrentEquipment.camera?.connected || this.phd2CurrentEquipment.mount?.connected;
      } catch (error) {
        console.error('Error fetching the information:', error);
      } finally {
        this.isFetchingPhd2Infos = false;
      }
    },

    checkStarLostByState(phd2AppState, guiderState) {
      const normalizedPhd2Status = String(phd2AppState || '').toLowerCase();
      const normalizedGuiderState = String(guiderState || '').toLowerCase();

      return (
        normalizedPhd2Status.includes('lostlock') || normalizedGuiderState.includes('lostlock')
      );
    },

    startFetching() {
      console.log('Start fetching graph data...');
      if (!this.intervalId) {
        this.intervalId = setInterval(this.fetchGraphInfos, 1000);
      }
    },

    stopFetching() {
      console.log('Stop fetching graph data...');
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },

    clearGuideGraph(lastStepId) {
      const parsedStepId = Number(lastStepId);
      this.clearedAfterStepId = Number.isFinite(parsedStepId) ? parsedStepId : null;
    },

    resetGuideGraphClear() {
      this.clearedAfterStepId = null;
    },

    async setPHD2Profil(id) {
      try {
        const response = await apiPinsService.setPHD2SelectedProfile(id);
        if (response.Success && response.Response) {
          return response;
        }
      } catch (error) {
        console.error('Error setting PHD2 profile:', error);
        throw error;
      }
    },

    // PHD2 Camera Actions (PINS)
    async fetchPHD2Cameras() {
      const store = apiStore();
      if (!store.isPINS) return;
      this.phd2CamerasLoading = true;
      try {
        const response = await apiPinsService.getPHD2CameraList();
        if (response.Success && response.Response) {
          this.phd2Cameras = response.Response.Cameras;
          this.phd2SelectedCameraIndex = response.Response.SelectedIndex;
          this.phd2SelectedCameraName = response.Response.Cameras[response.Response.SelectedIndex];
        }
      } catch (error) {
        console.error('Error fetching PHD2 cameras:', error);
      } finally {
        this.phd2CamerasLoading = false;
      }
    },

    async setPHD2Camera(index) {
      try {
        const response = await apiPinsService.setPHD2SelectedCamera(index);
        if (response.Success && response.Response) {
          this.phd2SelectedCameraIndex = response.Response.Index;
          this.phd2SelectedCameraName = response.Response.Name;
          return response;
        }
      } catch (error) {
        console.error('Error setting PHD2 camera:', error);
        throw error;
      }
    },

    async refreshPHD2SelectedCamera() {
      const store = apiStore();
      if (!store.isPINS) return;
      try {
        const response = await apiPinsService.getPHD2SelectedCamera();
        if (response.Success && response.Response) {
          this.phd2SelectedCameraIndex = response.Response.Index;
          this.phd2SelectedCameraName = response.Response.Name;
        }
      } catch (error) {
        console.error('Error refreshing PHD2 selected camera:', error);
      }
    },

    // PHD2 Mount Actions (PINS)
    async fetchPHD2Mounts() {
      const store = apiStore();
      if (!store.isPINS) return;
      this.phd2MountsLoading = true;
      try {
        const response = await apiPinsService.getPHD2MountList();
        if (response.Success && response.Response) {
          this.phd2Mounts = response.Response.Mounts;
          this.phd2SelectedMountIndex = response.Response.SelectedIndex;
          this.phd2SelectedMountName = response.Response.Mounts[response.Response.SelectedIndex];
        }
      } catch (error) {
        console.error('Error fetching PHD2 mounts:', error);
      } finally {
        this.phd2MountsLoading = false;
      }
    },

    async setPHD2Mount(index) {
      try {
        const response = await apiPinsService.setPHD2SelectedMount(index);
        if (response.Success && response.Response) {
          this.phd2SelectedMountIndex = response.Response.Index;
          this.phd2SelectedMountName = response.Response.Name;
          return response;
        }
      } catch (error) {
        console.error('Error setting PHD2 mount:', error);
        throw error;
      }
    },

    async refreshPHD2SelectedMount() {
      const store = apiStore();
      if (!store.isPINS) return;
      try {
        const response = await apiPinsService.getPHD2SelectedMount();
        if (response.Success && response.Response) {
          this.phd2SelectedMountIndex = response.Response.Index;
          this.phd2SelectedMountName = response.Response.Name;
        }
      } catch (error) {
        console.error('Error refreshing PHD2 selected mount:', error);
      }
    },

    // PHD2 Focal Length Actions (PINS)
    async fetchPHD2FocalLength() {
      const store = apiStore();
      if (!store.isPINS) return;
      this.phd2FocalLengthLoading = true;
      try {
        const response = await apiPinsService.getPHD2Focallength();
        if (response.Success && response.Response) {
          this.phd2FocalLength = response.Response.FocalLength;
        }
      } catch (error) {
        console.error('Error fetching PHD2 focal length:', error);
      } finally {
        this.phd2FocalLengthLoading = false;
      }
    },

    async setPHD2FocalLength(focalLength) {
      try {
        const response = await apiPinsService.setPHD2Focallength(focalLength);
        if (response.Success && response.Response) {
          this.phd2FocalLength = response.Response.FocalLength;
          return response;
        }
      } catch (error) {
        console.error('Error setting PHD2 focal length:', error);
        throw error;
      }
    },

    // PHD2 Calibration Step Actions (PINS)
    async fetchPHD2CalibrationStep() {
      const store = apiStore();
      if (!store.isPINS) return;
      this.phd2CalibrationStepLoading = true;
      try {
        const response = await apiPinsService.getPHD2CalibrationStep();
        if (response.Success && response.Response) {
          this.phd2CalibrationStep = response.Response.CalibrationStep;
        }
      } catch (error) {
        console.error('Error fetching PHD2 calibration step:', error);
      } finally {
        this.phd2CalibrationStepLoading = false;
      }
    },

    async setPHD2CalibrationStep(calibrationStep) {
      try {
        const response = await apiPinsService.setPHD2CalibrationStep(calibrationStep);
        if (response.Success && response.Response) {
          this.phd2CalibrationStep = response.Response.CalibrationStep;
          return response;
        }
      } catch (error) {
        console.error('Error setting PHD2 calibration step:', error);
        throw error;
      }
    },

    // PHD2 Reverse DEC After Flip Actions (PINS)
    async fetchPHD2ReverseDecAfterFlip() {
      const store = apiStore();
      if (!store.isPINS) return;
      this.phd2ReverseDecAfterFlipLoading = true;
      try {
        const response = await apiPinsService.getPHD2ReverseDecAfterFlip();
        if (response.Success && response.Response) {
          this.phd2ReverseDecAfterFlip = response.Response.ReverseDecAfterFlip;
        }
      } catch (error) {
        console.error('Error fetching PHD2 reverse DEC after flip:', error);
      } finally {
        this.phd2ReverseDecAfterFlipLoading = false;
      }
    },

    async setPHD2ReverseDecAfterFlip(enabled) {
      try {
        const response = await apiPinsService.setPHD2ReverseDecAfterFlip(enabled);
        if (response.Success && response.Response) {
          this.phd2ReverseDecAfterFlip = response.Response.ReverseDecAfterFlip;
          return response;
        }
      } catch (error) {
        console.error('Error setting PHD2 reverse DEC after flip:', error);
        throw error;
      }
    },

    // PHD2 Guide Algorithm RA Actions (PINS)
    async fetchPHD2GuideAlgorithmRA() {
      const store = apiStore();
      if (!store.isPINS) return;
      this.phd2GuideAlgorithmRALoading = true;
      try {
        const response = await apiPinsService.getPHD2GuideAlgorithmRA();
        if (response.Success && response.Response) {
          this.phd2GuideAlgorithmRA = response.Response.GuideAlgorithmRA;
        }
      } catch (error) {
        console.error('Error fetching PHD2 guide algorithm RA:', error);
      } finally {
        this.phd2GuideAlgorithmRALoading = false;
      }
    },

    async setPHD2GuideAlgorithmRA(algorithm) {
      try {
        const response = await apiPinsService.setPHD2GuideAlgorithmRA(algorithm);
        if (response.Success && response.Response) {
          this.phd2GuideAlgorithmRA = response.Response.GuideAlgorithmRA;
          return response;
        }
      } catch (error) {
        console.error('Error setting PHD2 guide algorithm RA:', error);
        throw error;
      }
    },

    // PHD2 Guide Algorithm DEC Actions (PINS)
    async fetchPHD2GuideAlgorithmDEC() {
      const store = apiStore();
      if (!store.isPINS) return;
      this.phd2GuideAlgorithmDECLoading = true;
      try {
        const response = await apiPinsService.getPHD2GuideAlgorithmDEC();
        if (response.Success && response.Response) {
          this.phd2GuideAlgorithmDEC = response.Response.GuideAlgorithmDEC;
        }
      } catch (error) {
        console.error('Error fetching PHD2 guide algorithm DEC:', error);
      } finally {
        this.phd2GuideAlgorithmDECLoading = false;
      }
    },

    async setPHD2GuideAlgorithmDEC(algorithm) {
      try {
        const response = await apiPinsService.setPHD2GuideAlgorithmDEC(algorithm);
        if (response.Success && response.Response) {
          this.phd2GuideAlgorithmDEC = response.Response.GuideAlgorithmDEC;
          return response;
        }
      } catch (error) {
        console.error('Error setting PHD2 guide algorithm DEC:', error);
        throw error;
      }
    },

    // PHD2 Profile Management Actions
    async createPHD2Profile(profileName) {
      try {
        const response = await apiPinsService.createPHD2Profile(profileName);
        if (response.Success && response.Response) {
          // Reload profiles list after creation
          const profilesResponse = await apiService.getPhd2Profile();
          if (profilesResponse.Response && profilesResponse.Response.EquipmentProfiles) {
            this.phd2EquipmentProfiles = profilesResponse.Response.EquipmentProfiles;
          }
          return response;
        }
      } catch (error) {
        console.error('Error creating PHD2 profile:', error);
        throw error;
      }
    },

    async renamePHD2Profile(newName, profileId) {
      try {
        console.log('Renaming profile ID', profileId, 'to', newName);
        await this.setPHD2Profil(profileId);
        const response = await apiPinsService.renamePHD2Profile(newName);
        if (response.Success) {
          // Reload profiles list after rename
          const profilesResponse = await apiService.getPhd2Profile();
          if (profilesResponse.Response && profilesResponse.Response.EquipmentProfiles) {
            this.phd2EquipmentProfiles = profilesResponse.Response.EquipmentProfiles;
          }
          return response;
        }
      } catch (error) {
        console.error('Error renaming PHD2 profile:', error);
        throw error;
      }
    },

    async deletePHD2Profile(profileName) {
      try {
        // Validate that at least 2 profiles exist before deletion
        if (this.phd2EquipmentProfiles.length <= 1) {
          throw new Error('Cannot delete the last profile');
        }

        // Get current profile before deletion
        const currentProfileResponse = await apiService.getPhd2CurrentProfile();
        const currentProfileName = currentProfileResponse.Response?.Profile?.name;
        const isCurrentProfileDeleted = currentProfileName === profileName;

        // Delete the profile
        const response = await apiPinsService.deletePHD2Profile(profileName);
        if (response.Success) {
          // Reload profiles list after deletion
          const profilesResponse = await apiService.getPhd2Profile();
          if (profilesResponse.Response && profilesResponse.Response.EquipmentProfiles) {
            this.phd2EquipmentProfiles = profilesResponse.Response.EquipmentProfiles;

            // If current profile was deleted, switch to first available profile
            if (isCurrentProfileDeleted && this.phd2EquipmentProfiles.length > 0) {
              const newProfileId = 1; // First profile ID is 1
              await this.setPHD2Profil(newProfileId);

              // Reload all PHD2 settings
              await this.fetchPHD2Cameras();
              await this.refreshPHD2SelectedMount();
              await this.fetchPHD2FocalLength();
              await this.fetchPHD2CalibrationStep();
              await this.fetchPHD2ReverseDecAfterFlip();
              await this.fetchPHD2GuideAlgorithmRA();
              await this.fetchPHD2GuideAlgorithmDEC();
            }
          }
          return response;
        }
      } catch (error) {
        console.error('Error deleting PHD2 profile:', error);
        throw error;
      }
    },
  },
});
