const AnalysisScreen = {
  title: "Analyse läuft",
  hasStarted: false,

  render() {
    const exam = AppState.currentExam;

    if (!exam) {
      return `
        <section class="screen analysis-screen">
          <div class="card">
            <h2>Analyse läuft</h2>
            <p>Keine Untersuchung aktiv.</p>
            <div class="form-actions">
              <button id="btn-analysis-back-home" class="primary-button" type="button">
                Zur Startseite
              </button>
            </div>
          </div>
        </section>
      `;
    }

    return `
      <section class="screen analysis-screen">
        <div class="card">
          <h2>Analyse läuft</h2>

          <div class="info-line">
            <span>Untersuchungs-ID</span>
            <strong>${Utils.escapeHtml(exam.examNumber)}</strong>
          </div>

          <div class="info-line">
            <span>Fortschritt</span>
            <strong id="analysis-percent-label">0 %</strong>
          </div>

          <div style="margin-top:16px;">
            <div style="width:100%;height:18px;background:#e5e7eb;border-radius:999px;overflow:hidden;">
              <div
                id="analysis-progress-fill"
                style="width:0%;height:100%;background:#2563eb;transition:width 0.25s ease;"
              ></div>
            </div>
          </div>

          <div class="form-result" style="margin-top:16px;">
            <div class="form-result-row">
              <span>Aktueller Schritt</span>
              <strong id="analysis-step-label">Analyse wird vorbereitet…</strong>
            </div>
          </div>

          <p class="capture-note">
            Bitte warten. Die Bilder werden analysiert.
          </p>

          <div id="analysis-error-box" class="error-text hidden"></div>
        </div>
      </section>
    `;
  },

  bind() {
    document
      .getElementById("btn-analysis-back-home")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.HOME);
      });

    if (!this.hasStarted) {
      this.hasStarted = true;
      this.start();
    } else {
      this.updateProgressUI();
    }
  },

  async start() {
    try {
      const exam = AppState.currentExam;
      const patient = AppState.currentPatient;

      if (!exam || !patient) {
        throw new Error("Analyse kann nicht gestartet werden.");
      }

      this.updateProgressUI();

      await AnalysisService.run(exam, patient);

      setTimeout(() => {
        this.hasStarted = false;
        Router.goTo(Routes.SUMMARY);
      }, 400);
    } catch (error) {
      console.error(error);
      AppState.analysisStatus.running = false;
      AppState.analysisStatus.error =
        error?.message || "Analyse konnte nicht abgeschlossen werden.";
      this.showError(AppState.analysisStatus.error);
      this.hasStarted = false;
    }
  },

  updateProgressUI() {
    const fill = document.getElementById("analysis-progress-fill");
    const percent = document.getElementById("analysis-percent-label");
    const step = document.getElementById("analysis-step-label");

    if (fill) {
      fill.style.width = `${AppState.analysisStatus.progress || 0}%`;
    }

    if (percent) {
      percent.textContent = `${AppState.analysisStatus.progress || 0} %`;
    }

    if (step) {
      step.textContent =
        AppState.analysisStatus.stepLabel || "Analyse wird vorbereitet…";
    }
  },

  showError(message) {
    const box = document.getElementById("analysis-error-box");
    if (!box) return;

    box.textContent = message;
    box.classList.remove("hidden");
  },
};