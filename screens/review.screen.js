const ReviewScreen = {
  title: "Untersuchung prüfen",

  render() {
    const patient = AppState.currentPatient;
    const exam = AppState.currentExam;
    const settings = SettingsStore.get();

    if (!patient || !exam) {
      return `
        <section class="screen review-screen">
          <div class="card">
            <h2>Untersuchung prüfen</h2>
            <p>Keine aktive Untersuchung gefunden.</p>
            <div class="form-actions">
              <button id="btn-review-back-home" class="primary-button" type="button">
                Zur Startseite
              </button>
            </div>
          </div>
        </section>
      `;
    }

    const imageSet = ImageStore.getByExamId(exam.id);
    const thermalSet = exam.thermalImageSetId ? ThermalStore.getByExamId(exam.id) : ThermalStore.getByExamId(exam.id);
    const totalCaptured = imageSet ? ImageStore.countCaptured(exam.id) : 0;
    const totalThermal = settings.thermalEnabled ? ThermalStore.countImported(exam.id) : 0;

    return `
      <section class="screen review-screen">
        <div class="review-grid">
          <div class="card">
            <h2>Untersuchung prüfen</h2>

            <div class="info-line">
              <span>Patient</span>
              <strong>${Utils.escapeHtml(patient.firstName)} ${Utils.escapeHtml(patient.lastName)}</strong>
            </div>

            <div class="info-line">
              <span>Patientennummer</span>
              <strong>${Utils.escapeHtml(patient.patientNumber)}</strong>
            </div>

            <div class="info-line">
              <span>Untersuchungs-ID</span>
              <strong>${Utils.escapeHtml(exam.examNumber)}</strong>
            </div>

            <div class="info-line">
              <span>Alter</span>
              <strong>${Utils.escapeHtml(String(patient.ageYears ?? "-"))}</strong>
            </div>

            <div class="info-line">
              <span>BMI</span>
              <strong>${Utils.escapeHtml(String(patient.bmi ?? "-"))}</strong>
            </div>

            <div class="form-actions">
              <button id="btn-review-edit-patient" class="secondary-button" type="button">
                Daten bearbeiten
              </button>
            </div>
          </div>

          <div class="card">
            <h2>Status</h2>

            <div class="review-status-list">
              <div class="review-status-row">
                <span>Standardbilder</span>
                <strong>${totalCaptured} / 12</strong>
              </div>

              <div class="review-status-row">
                <span>Wärmebilder</span>
                <strong>${settings.thermalEnabled ? `${totalThermal} / 9` : "deaktiviert"}</strong>
              </div>

              <div class="review-status-row">
                <span>Analyse</span>
                <strong>noch nicht gestartet</strong>
              </div>
            </div>
          </div>

          ${this.renderGroupCard("front", "Vorne", imageSet)}
          ${this.renderGroupCard("back", "Hinten", imageSet)}
          ${this.renderGroupCard("left", "Links", imageSet)}
          ${this.renderGroupCard("right", "Rechts", imageSet)}

          ${
            settings.thermalEnabled
              ? `
          <div class="card">
            <h2>Wärmebilder</h2>

            ${
              totalThermal > 0
                ? `
            <div class="review-status-list">
              <div class="review-status-row">
                <span>Hinten</span>
                <strong>${this.countThermalView(thermalSet, "back")} / 3</strong>
              </div>
              <div class="review-status-row">
                <span>Links 45°</span>
                <strong>${this.countThermalView(thermalSet, "left45")} / 3</strong>
              </div>
              <div class="review-status-row">
                <span>Rechts 45°</span>
                <strong>${this.countThermalView(thermalSet, "right45")} / 3</strong>
              </div>
            </div>
            `
                : `
            <div class="review-thermal-placeholder">
              Keine Wärmebilder eingefügt
            </div>
            `
            }

            <div class="form-actions">
              <button id="btn-review-thermal" class="secondary-button" type="button">
                Wärmebilder hinzufügen
              </button>
            </div>
          </div>
          `
              : `
          <div class="card">
            <h2>Wärmebilder</h2>

            <div class="review-thermal-placeholder">
              Wärmebildfunktion ist in den Einstellungen deaktiviert.
            </div>
          </div>
          `
          }

          <div class="card">
            <div class="form-actions">
              <button id="btn-review-start-analysis" class="primary-button" type="button">
                Analyse starten
              </button>

              <button id="btn-review-back-capture" class="secondary-button" type="button">
                Zur Aufnahme zurück
              </button>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  renderGroupCard(view, label, imageSet) {
    const items = imageSet?.views?.[view] || [null, null, null];

    const cardsHtml = items
      .map((item, index) => {
        const slotNumber = index + 1;
        const title = `${label} ${slotNumber}`;

        if (!item) {
          return `
            <div class="review-image-card">
              <div class="empty-state">Fehlt</div>
              <div class="review-image-meta">
                <div class="review-image-title">${Utils.escapeHtml(title)}</div>
                <button
                  class="small-button btn-review-replace"
                  type="button"
                  data-view="${Utils.escapeHtml(view)}"
                  data-index="${slotNumber}"
                >
                  Aufnehmen
                </button>
              </div>
            </div>
          `;
        }

        return `
          <div class="review-image-card">
            <img src="${item.filePreview}" alt="${Utils.escapeHtml(title)}" />

            <div class="review-image-meta">
              <div class="review-image-title">${Utils.escapeHtml(title)}</div>

              <button
                class="small-button btn-review-replace"
                type="button"
                data-view="${Utils.escapeHtml(view)}"
                data-index="${slotNumber}"
              >
                Ersetzen
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    return `
      <div class="card">
        <div class="review-group">
          <h3>${Utils.escapeHtml(label)}</h3>

          <div class="review-image-grid">
            ${cardsHtml}
          </div>

          <div class="review-group-actions">
            <button
              class="secondary-button btn-review-repeat-view"
              type="button"
              data-view="${Utils.escapeHtml(view)}"
            >
              ${Utils.escapeHtml(label)} erneut aufnehmen
            </button>
          </div>
        </div>
      </div>
    `;
  },

  bind() {
    document
      .getElementById("btn-review-back-home")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.HOME);
      });

    document
      .getElementById("btn-review-edit-patient")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.PATIENT_FORM);
      });

    document
      .getElementById("btn-review-thermal")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.THERMAL);
      });

    document
      .getElementById("btn-review-back-capture")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.CAPTURE);
      });

    document
      .getElementById("btn-review-start-analysis")
      ?.addEventListener("click", () => {
        const exam = AppState.currentExam;
        if (!exam) {
          alert("Keine Untersuchung aktiv.");
          return;
        }

        const count = ImageStore.countCaptured(exam.id);
        if (count < 12) {
          alert("Alle 12 Standardbilder sind erforderlich.");
          return;
        }

        Router.goTo(Routes.ANALYSIS);
      });

    document.querySelectorAll(".btn-review-replace").forEach((button) => {
      button.addEventListener("click", () => {
        const view = button.getAttribute("data-view");
        const index = Number(button.getAttribute("data-index"));
        const slotIndex = this.findSequenceIndex(view, index);

        if (slotIndex === null) return;

        AppState.captureStatus.currentSlotIndex = slotIndex;
        Router.goTo(Routes.CAPTURE);
      });
    });

    document.querySelectorAll(".btn-review-repeat-view").forEach((button) => {
      button.addEventListener("click", () => {
        const view = button.getAttribute("data-view");
        const confirmed = window.confirm(
          "Alle drei Bilder dieser Ansicht ersetzen?"
        );

        if (!confirmed) return;

        const firstIndex = this.findSequenceIndex(view, 1);
        if (firstIndex === null) return;

        AppState.captureStatus.currentSlotIndex = firstIndex;
        Router.goTo(Routes.CAPTURE);
      });
    });
  },

  countThermalView(thermalSet, view) {
    if (!thermalSet || !thermalSet.views?.[view]) return 0;
    return thermalSet.views[view].filter(Boolean).length;
  },

  findSequenceIndex(view, indexInView) {
    return CaptureSequence.findIndex(
      (item) => item.view === view && item.indexInView === indexInView
    );
  },
};