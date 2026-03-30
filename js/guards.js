const Guards = {
  hasPatient() {
    return Boolean(AppState.currentPatient && AppState.currentPatient.id);
  },

  hasExam() {
    return Boolean(AppState.currentExam && AppState.currentExam.id);
  },

  hasAnalysis() {
    return Boolean(
      AppState.currentExam &&
      AppState.currentExam.analysisId &&
      AnalysisStore.findByExamId(AppState.currentExam.id)
    );
  },

  getCurrentAnalysis() {
    if (!this.hasExam()) return null;
    return AnalysisStore.findByExamId(AppState.currentExam.id) || null;
  },

  getCapturedCount() {
    if (!this.hasExam()) return 0;
    return ImageStore.countCaptured(AppState.currentExam.id);
  },

  getThermalCount() {
    if (!this.hasExam()) return 0;
    return ThermalStore.countImported(AppState.currentExam.id);
  },

  canOpenCapture() {
    return this.hasPatient() && this.hasExam();
  },

  canOpenReview() {
    return this.hasPatient() && this.hasExam();
  },

  canOpenAnalysis() {
    return this.hasPatient() && this.hasExam() && this.getCapturedCount() >= 12;
  },

  canOpenResults() {
    return this.hasPatient() && this.hasExam() && this.hasAnalysis();
  },

  getBestHomeAction() {
    if (!this.hasPatient()) {
      return {
        label: "Patient auswählen",
        route: Routes.PATIENTS,
        text: "Noch kein Patient aktiv.",
      };
    }

    if (!this.hasExam()) {
      return {
        label: "Untersuchung starten",
        route: Routes.EXAM_START,
        text: "Patient aktiv, aber noch keine laufende Untersuchung.",
      };
    }

    const capturedCount = this.getCapturedCount();
    if (capturedCount < 12) {
      return {
        label: "Aufnahme fortsetzen",
        route: Routes.CAPTURE,
        text: `Untersuchung aktiv. ${capturedCount} / 12 Standardbilder gespeichert.`,
      };
    }

    if (!this.hasAnalysis()) {
      return {
        label: "Prüfen / Analyse starten",
        route: Routes.REVIEW,
        text: "Standardbilder vollständig. Analyse noch nicht abgeschlossen.",
      };
    }

    return {
      label: "Ergebnis öffnen",
      route: Routes.SUMMARY,
      text: "Analyse abgeschlossen. Ergebnisse sind verfügbar.",
    };
  },

  resolveRoute(screen) {
    switch (screen) {
      case Routes.CAPTURE:
        return this.canOpenCapture() ? screen : Routes.HOME;
      case Routes.THERMAL:
      case Routes.REVIEW:
        return this.canOpenReview() ? screen : Routes.HOME;
      case Routes.ANALYSIS:
        return this.canOpenAnalysis() ? screen : Routes.HOME;
      case Routes.SUMMARY:
      case Routes.DETAILS:
      case Routes.SPINE3D:
      case Routes.IMAGES:
      case Routes.REPORT:
      case Routes.COMPARISON:
        return this.canOpenResults() ? screen : this.hasExam() ? Routes.REVIEW : Routes.HOME;
      default:
        return screen;
    }
  },
};