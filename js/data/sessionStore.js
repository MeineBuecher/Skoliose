const SessionStore = {
  storageKey: "skoliose_session_v1",

  getDefaultSession() {
    return {
      currentScreen: Routes.HOME,
      currentPatientId: null,
      currentExamId: null,
      reportMode: "fachkraft",
      navigationHistory: [],
      captureStatus: {
        currentSlotIndex: 0,
        totalCaptured: 0,
        streamActive: false,
      },
      thermalStatus: {
        currentSlotIndex: 0,
        totalImported: 0,
      },
      analysisStatus: {
        running: false,
        progress: 0,
        stepKey: "",
        stepLabel: "",
        completed: false,
        needsReanalysis: false,
        error: "",
      },
      savedAt: null,
    };
  },

  get() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return this.getDefaultSession();

    try {
      const parsed = JSON.parse(raw);
      return {
        ...this.getDefaultSession(),
        ...(parsed || {}),
        captureStatus: {
          ...this.getDefaultSession().captureStatus,
          ...(parsed?.captureStatus || {}),
        },
        thermalStatus: {
          ...this.getDefaultSession().thermalStatus,
          ...(parsed?.thermalStatus || {}),
        },
        analysisStatus: {
          ...this.getDefaultSession().analysisStatus,
          ...(parsed?.analysisStatus || {}),
          running: false,
        },
      };
    } catch (error) {
      console.error("SessionStore.get parse error:", error);
      return this.getDefaultSession();
    }
  },

  save(session) {
    const payload = {
      ...this.getDefaultSession(),
      ...(session || {}),
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(this.storageKey, JSON.stringify(payload));
    return payload;
  },

  clear() {
    localStorage.removeItem(this.storageKey);
  },

  buildFromAppState() {
    return {
      currentScreen: AppState.currentScreen || Routes.HOME,
      currentPatientId: AppState.currentPatient?.id || null,
      currentExamId: AppState.currentExam?.id || null,
      reportMode: AppState.reportMode || "fachkraft",
      navigationHistory: Array.isArray(AppState.navigationHistory)
        ? AppState.navigationHistory
        : [],
      captureStatus: {
        currentSlotIndex: Number(AppState.captureStatus?.currentSlotIndex || 0),
        totalCaptured: Number(AppState.captureStatus?.totalCaptured || 0),
        streamActive: false,
      },
      thermalStatus: {
        currentSlotIndex: Number(AppState.thermalStatus?.currentSlotIndex || 0),
        totalImported: Number(AppState.thermalStatus?.totalImported || 0),
      },
      analysisStatus: {
        running: false,
        progress: Number(AppState.analysisStatus?.progress || 0),
        stepKey: AppState.analysisStatus?.stepKey || "",
        stepLabel: AppState.analysisStatus?.stepLabel || "",
        completed: Boolean(AppState.analysisStatus?.completed),
        needsReanalysis: Boolean(AppState.analysisStatus?.needsReanalysis),
        error: AppState.analysisStatus?.error || "",
      },
    };
  },

  syncFromAppState() {
    return this.save(this.buildFromAppState());
  },

  restoreIntoAppState() {
    const session = this.get();

    const patient =
      session.currentPatientId
        ? PatientStore.getAll().find((item) => item.id === session.currentPatientId) || null
        : null;

    const exam =
      session.currentExamId
        ? ExamStore.getAll().find((item) => item.id === session.currentExamId) || null
        : null;

    AppState.currentPatient = patient;
    AppState.currentExam = exam;
    AppState.currentScreen = this.sanitizeScreen(session.currentScreen, exam);
    AppState.reportMode = session.reportMode || SettingsStore.get().defaultMode || "fachkraft";
    AppState.navigationHistory = this.sanitizeHistory(session.navigationHistory || []);
    AppState.captureStatus = {
      ...AppState.captureStatus,
      ...session.captureStatus,
      streamActive: false,
    };
    AppState.thermalStatus = {
      ...AppState.thermalStatus,
      ...session.thermalStatus,
    };
    AppState.analysisStatus = {
      ...AppState.analysisStatus,
      ...session.analysisStatus,
      running: false,
    };

    if (exam) {
      AppState.captureStatus.totalCaptured = ImageStore.countCaptured(exam.id);
      AppState.thermalStatus.totalImported = ThermalStore.countImported(exam.id);
    } else {
      AppState.captureStatus.totalCaptured = 0;
      AppState.thermalStatus.totalImported = 0;
    }

    return {
      patient,
      exam,
      screen: AppState.currentScreen,
    };
  },

  sanitizeScreen(screen, exam) {
    const validScreens = new Set([
      Routes.HOME,
      Routes.PATIENTS,
      Routes.PATIENT_FORM,
      Routes.EXAM_START,
      Routes.CAPTURE,
      Routes.THERMAL,
      Routes.REVIEW,
      Routes.ANALYSIS,
      Routes.SUMMARY,
      Routes.DETAILS,
      Routes.SPINE3D,
      Routes.IMAGES,
      Routes.REPORT,
      Routes.COMPARISON,
      Routes.SETTINGS,
    ]);

    if (!validScreens.has(screen)) {
      return Routes.HOME;
    }

    const screensNeedingExam = new Set([
      Routes.CAPTURE,
      Routes.THERMAL,
      Routes.REVIEW,
      Routes.ANALYSIS,
      Routes.SUMMARY,
      Routes.DETAILS,
      Routes.SPINE3D,
      Routes.IMAGES,
      Routes.REPORT,
      Routes.COMPARISON,
    ]);

    if (screensNeedingExam.has(screen) && !exam) {
      return Routes.HOME;
    }

    if (
      screen === Routes.ANALYSIS &&
      exam &&
      exam.analysisId
    ) {
      return Routes.SUMMARY;
    }

    return screen;
  },

  sanitizeHistory(history) {
    if (!Array.isArray(history)) return [];
    return history
      .filter((item) => item && typeof item.screen === "string")
      .map((item) => ({
        screen: item.screen,
        params: item.params && typeof item.params === "object" ? item.params : {},
      }));
  },
};