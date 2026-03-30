const App = {
  init() {
    try {
      const settings = typeof SettingsStore !== "undefined" && SettingsStore.get
        ? SettingsStore.get()
        : { defaultMode: "fachkraft" };

      AppState.reportMode = settings.defaultMode || "fachkraft";

      document.getElementById("btn-back")?.addEventListener("click", () => {
        Router.goBack();
      });

      document.getElementById("btn-settings")?.addEventListener("click", () => {
        Router.goTo(Routes.SETTINGS);
      });

      if (typeof SessionStore !== "undefined" && SessionStore.restoreIntoAppState) {
        const restored = SessionStore.restoreIntoAppState();
        this.hardenRestoredState(restored?.exam || null);
      } else {
        AppState.currentScreen = Routes.HOME;
      }

      this.bindLifecyclePersistence();

      Router.currentParams = {};
      const startScreen =
        typeof Guards !== "undefined" && Guards.resolveRoute
          ? Guards.resolveRoute(AppState.currentScreen || Routes.HOME)
          : (AppState.currentScreen || Routes.HOME);

      Router.loadScreen(startScreen);

      if (typeof SessionStore !== "undefined" && SessionStore.syncFromAppState) {
        SessionStore.syncFromAppState();
      }
    } catch (error) {
      console.error("App.init failed:", error);
      this.renderEmergencyHome(error);
    }
  },

  hardenRestoredState(exam) {
    if (!exam) {
      AppState.captureStatus.totalCaptured = 0;
      AppState.thermalStatus.totalImported = 0;
      return;
    }

    AppState.captureStatus.totalCaptured =
      typeof ImageStore !== "undefined" && ImageStore.countCaptured
        ? ImageStore.countCaptured(exam.id)
        : 0;

    AppState.thermalStatus.totalImported =
      typeof ThermalStore !== "undefined" && ThermalStore.countImported
        ? ThermalStore.countImported(exam.id)
        : 0;

    if (AppState.currentScreen === Routes.CAPTURE && AppState.captureStatus.totalCaptured >= 12) {
      AppState.currentScreen = Routes.REVIEW;
    }

    if (AppState.currentScreen === Routes.ANALYSIS && exam.analysisId) {
      AppState.currentScreen = Routes.SUMMARY;
    }
  },

  bindLifecyclePersistence() {
    window.addEventListener("beforeunload", () => {
      try {
        SessionStore?.syncFromAppState?.();
      } catch (error) {
        console.error(error);
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        try {
          SessionStore?.syncFromAppState?.();
        } catch (error) {
          console.error(error);
        }
      }
    });
  },

  updateHeaderButtons() {
    const backButton = document.getElementById("btn-back");
    if (!backButton) return;

    backButton.disabled = !Array.isArray(AppState.navigationHistory) || AppState.navigationHistory.length === 0;
  },

  resetRuntimeState() {
    AppState.currentPatient = null;
    AppState.currentExam = null;
    AppState.currentScreen = Routes.HOME;
    AppState.reportMode =
      (typeof SettingsStore !== "undefined" && SettingsStore.get()?.defaultMode) || "fachkraft";
    AppState.navigationHistory = [];
    AppState.captureStatus = {
      currentSlotIndex: 0,
      totalCaptured: 0,
      streamActive: false,
    };
    AppState.thermalStatus = {
      currentSlotIndex: 0,
      totalImported: 0,
    };
    AppState.analysisStatus = {
      running: false,
      progress: 0,
      stepKey: "",
      stepLabel: "",
      completed: false,
      needsReanalysis: false,
      error: "",
    };
  },

  clearSessionAndGoHome() {
    this.resetRuntimeState();

    try {
      SessionStore?.clear?.();
    } catch (error) {
      console.error(error);
    }

    Router.currentParams = {};
    Router.loadScreen(Routes.HOME);
    this.updateHeaderButtons();

    try {
      SessionStore?.syncFromAppState?.();
    } catch (error) {
      console.error(error);
    }
  },

  goToBestNextStep() {
    try {
      if (typeof Guards !== "undefined" && Guards.getBestHomeAction) {
        const next = Guards.getBestHomeAction();
        Router.goTo(next.route);
        return;
      }
    } catch (error) {
      console.error(error);
    }

    Router.goTo(Routes.PATIENTS);
  },

  renderEmergencyHome(error) {
    console.error("Emergency home fallback:", error);

    const container = document.getElementById("screen-container");
    const screenTitle = document.getElementById("screen-title");

    if (!container || !screenTitle) return;

    AppState.currentScreen = Routes.HOME;
    screenTitle.textContent = "Startseite";

    container.innerHTML = `
      <section class="screen home-screen">
        <div class="card">
          <div class="app-cover">Skoliose<br>Analyse</div>
          <h2>Startseite</h2>
          <p>Die App wurde im abgesicherten Startmodus geöffnet.</p>
        </div>

        <div class="card">
          <div class="main-menu">
            <button id="btn-emergency-patients" class="primary-button" type="button">
              Patienten öffnen
            </button>

            <button id="btn-emergency-settings" class="secondary-button" type="button">
              Einstellungen
            </button>
          </div>
        </div>

        <div class="card">
          <p class="capture-note capture-error">
            Startfehler: ${Utils.escapeHtml(error?.message || "Unbekannter Fehler")}
          </p>
        </div>
      </section>
    `;

    document.getElementById("btn-emergency-patients")?.addEventListener("click", () => {
      Router.goTo(Routes.PATIENTS);
    });

    document.getElementById("btn-emergency-settings")?.addEventListener("click", () => {
      Router.goTo(Routes.SETTINGS);
    });

    this.updateHeaderButtons();
  },

  showPlannedScreen(name) {
    alert(`${name} folgt im nächsten Bauschritt.`);
  },
};

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});