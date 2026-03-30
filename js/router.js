const Router = {
  currentParams: {},

  async goTo(screen, params = {}) {
    await this.runBeforeLeave();

    if (AppState.currentScreen) {
      AppState.navigationHistory.push({
        screen: AppState.currentScreen,
        params: { ...this.currentParams },
      });
    }

    const safeScreen = Guards.resolveRoute(screen);
    AppState.currentScreen = safeScreen;
    this.currentParams = { ...params };
    this.loadScreen(safeScreen, this.currentParams);
    SessionStore.syncFromAppState();
  },

  async goBack() {
    const previous = AppState.navigationHistory.pop();
    if (!previous) return;

    await this.runBeforeLeave();

    const safeScreen = Guards.resolveRoute(previous.screen);
    AppState.currentScreen = safeScreen;
    this.currentParams = { ...(previous.params || {}) };
    this.loadScreen(safeScreen, this.currentParams);
    SessionStore.syncFromAppState();
  },

  async reload(params = null) {
    if (params) {
      this.currentParams = { ...this.currentParams, ...params };
    }

    await this.runBeforeLeave(false);

    const safeScreen = Guards.resolveRoute(AppState.currentScreen);
    AppState.currentScreen = safeScreen;
    this.loadScreen(safeScreen, this.currentParams);
    SessionStore.syncFromAppState();
  },

  async runBeforeLeave(changeScreen = true) {
    const currentScreenModule = this.getScreenModule(AppState.currentScreen);
    if (
      currentScreenModule &&
      typeof currentScreenModule.beforeLeave === "function"
    ) {
      await currentScreenModule.beforeLeave(changeScreen);
    }
  },

  getScreenModule(screen) {
    switch (screen) {
      case Routes.HOME:
        return HomeScreen;
      case Routes.PATIENTS:
        return PatientsScreen;
      case Routes.PATIENT_FORM:
        return PatientFormScreen;
      case Routes.EXAM_START:
        return ExamStartScreen;
      case Routes.CAPTURE:
        return CaptureScreen;
      case Routes.THERMAL:
        return ThermalScreen;
      case Routes.REVIEW:
        return ReviewScreen;
      case Routes.ANALYSIS:
        return AnalysisScreen;
      case Routes.SUMMARY:
        return SummaryScreen;
      case Routes.DETAILS:
        return DetailsScreen;
      case Routes.SPINE3D:
        return Spine3DScreen;
      case Routes.IMAGES:
        return ImagesScreen;
      case Routes.REPORT:
        return ReportScreen;
      case Routes.COMPARISON:
        return ComparisonScreen;
      case Routes.SETTINGS:
        return SettingsScreen;
      default:
        return null;
    }
  },

  loadScreen(screen, params = {}) {
    document.body.classList.remove("capture-mode");
    const container = document.getElementById("screen-container");
    const screenTitle = document.getElementById("screen-title");

    const safeScreen = Guards.resolveRoute(screen);
    const screenModule = this.getScreenModule(safeScreen);

    if (!screenModule) {
      container.innerHTML = `<section class="screen"><div class="card"><h2>Screen</h2></div></section>`;
      screenTitle.textContent = "Screen";
      App.updateHeaderButtons();
      return;
    }

    AppState.currentScreen = safeScreen;
    container.innerHTML = screenModule.render(params.searchTerm || "");
    screenTitle.textContent = screenModule.title;
    App.updateHeaderButtons();
    screenModule.bind();
  },
};