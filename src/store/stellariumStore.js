import { defineStore } from 'pinia';
import { useSettingsStore } from './settingsStore';

export const useStellariumStore = defineStore('stellariumStore', {
  state: () => ({
    stel: null,
    baseUrl: '',
    landscapeSourceCore: null,
    search: {
      RAangle: 0,
      DECangle: 0,
      RAangleString: '',
      DECangleString: '',
    },
  }),
  actions: {
    ensureLandscapeSource(core) {
      if (!core || this.landscapeSourceCore === core || !this.baseUrl) {
        return;
      }

      core.landscapes.addDataSource({
        url: this.baseUrl + 'landscapes/guereins',
        key: 'guereins',
      });
      this.landscapeSourceCore = core;
    },

    updateStellariumCore() {
      const settingsStore = useSettingsStore();
      if (this.stel) {
        const core = this.stel.core;

        this.ensureLandscapeSource(core);
        core.constellations.lines_visible = settingsStore.stellarium.constellationsLinesVisible;
        core.constellations.labels_visible = settingsStore.stellarium.constellationsLinesVisible;
        core.lines.azimuthal.visible = settingsStore.stellarium.azimuthalLinesVisible;
        core.lines.equatorial.visible = settingsStore.stellarium.equatorialLinesVisible;
        core.lines.meridian.visible = settingsStore.stellarium.meridianLinesVisible;
        core.lines.ecliptic.visible = settingsStore.stellarium.eclipticLinesVisible;
        core.atmosphere.visible = settingsStore.stellarium.atmosphereVisible;
        core.dsos.visible = settingsStore.stellarium.dsosVisible; // Deep Sky Objects (Messier, NGC, etc.)
        core.landscapes.visible = settingsStore.stellarium.landscapesVisible;

        console.log('Stellarium settings updated:');
      }
    },
  },
});
