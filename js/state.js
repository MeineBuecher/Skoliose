const AppState = {
  currentScreen: Routes.HOME,
  currentPatient: null,
  currentExam: null,
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
};