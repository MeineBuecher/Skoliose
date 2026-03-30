const SettingsStore = {
  storageKey: "skoliose_settings_v1",

  getDefaults() {
    return {
      defaultCamera: "environment-camera",
      defaultMode: "fachkraft",
      thermalEnabled: true,
      appVersion: "1.0",
      buildLabel: "Medical Prototype",
    };
  },

  get() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return this.getDefaults();

    try {
      const parsed = JSON.parse(raw);
      return {
        ...this.getDefaults(),
        ...(parsed || {}),
      };
    } catch (error) {
      console.error("SettingsStore.get parse error:", error);
      return this.getDefaults();
    }
  },

  save(nextSettings) {
    const merged = {
      ...this.getDefaults(),
      ...(nextSettings || {}),
    };

    localStorage.setItem(this.storageKey, JSON.stringify(merged));
    return merged;
  },

  updatePartial(partial) {
    const current = this.get();
    return this.save({
      ...current,
      ...(partial || {}),
    });
  },

  reset() {
    localStorage.removeItem(this.storageKey);
    return this.getDefaults();
  },

  exportAllData() {
    return {
      exportedAt: new Date().toISOString(),
      settings: this.get(),
      patients: PatientStore.getAll(),
      exams: ExamStore.getAll(),
      imageSets: ImageStore.getAll(),
      analyses: AnalysisStore.getAll(),
      reports: ReportStore.getAll(),
    };
  },

  importAllData(data) {
    if (!data || typeof data !== "object") {
      throw new Error("Ungültige Backup-Datei.");
    }

    if (Array.isArray(data.patients)) {
      PatientStore.saveAll(data.patients);
    }

    if (Array.isArray(data.exams)) {
      ExamStore.saveAll(data.exams);
    }

    if (Array.isArray(data.imageSets)) {
      ImageStore.saveAll(data.imageSets);
    }

    if (Array.isArray(data.analyses)) {
      AnalysisStore.saveAll(data.analyses);
    }

    if (Array.isArray(data.reports)) {
      ReportStore.saveAll(data.reports);
    }

    if (data.settings && typeof data.settings === "object") {
      this.save(data.settings);
    }
  },

  clearAllData() {
    localStorage.removeItem(StorageKeys.PATIENTS);
    localStorage.removeItem(StorageKeys.EXAMS);
    localStorage.removeItem(StorageKeys.IMAGE_SETS);
    localStorage.removeItem(AnalysisStore.storageKey);
    localStorage.removeItem(ReportStore.storageKey);
    localStorage.removeItem(this.storageKey);
  },
};