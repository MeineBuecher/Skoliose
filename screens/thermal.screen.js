const ThermalScreen = {
  title: "Wärmebilder importieren",

  render() {
    const exam = AppState.currentExam;
    const settings = SettingsStore.get();

    if (!settings.thermalEnabled) {
      return `
        <section class="screen thermal-screen">
          <div class="card">
            <h2>Wärmebilder importieren</h2>
            <p>Die Wärmebildfunktion ist in den Einstellungen deaktiviert.</p>
            <div class="form-actions">
              <button id="btn-thermal-to-settings" class="primary-button" type="button">
                Zu den Einstellungen
              </button>
              <button id="btn-thermal-back-review" class="secondary-button" type="button">
                Zur Prüfseite
              </button>
            </div>
          </div>
        </section>
      `;
    }

    if (!exam) {
      return Utils.makeErrorCard(
        "Wärmebilder importieren",
        "Keine Untersuchung aktiv.",
        "btn-thermal-back-home",
        "Zur Startseite"
      );
    }

    const thermalSet = ThermalStore.ensureSet(exam.id);
    const totalImported = ThermalStore.countImported(exam.id);

    return `
      <section class="screen thermal-screen">
        <div class="review-grid">
          <div class="card">
            <h2>Wärmebilder importieren</h2>

            <div class="info-line">
              <span>Quelle</span>
              <strong>HIKMICRO Import</strong>
            </div>

            <div class="info-line">
              <span>Status</span>
              <strong>${totalImported} / 9</strong>
            </div>

            <div class="info-line">
              <span>Hinweis</span>
              <strong>Nur Einfügemodus</strong>
            </div>

            <p class="summary-text">
              Bitte exportierte oder gespeicherte HIKMICRO-Wärmebilder einzeln den vorgesehenen Positionen zuordnen.
            </p>
          </div>

          ${this.renderGroup("back", "Hinten", thermalSet)}
          ${this.renderGroup("left45", "Links 45°", thermalSet)}
          ${this.renderGroup("right45", "Rechts 45°", thermalSet)}

          <div class="card">
            <div class="form-actions">
              <button id="btn-thermal-back-review" class="secondary-button" type="button">
                Zur Prüfseite
              </button>
            </div>
          </div>

          <input id="thermal-file-input" type="file" accept="image/*" class="hidden" />
        </div>
      </section>
    `;
  },

  renderGroup(view, label, thermalSet) {
    const items = thermalSet?.views?.[view] || [null, null, null];

    return `
      <div class="card">
        <div class="review-group">
          <h3>${Utils.escapeHtml(label)}</h3>

          <div class="review-image-grid">
            ${items
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
                          class="small-button btn-thermal-import"
                          type="button"
                          data-view="${Utils.escapeHtml(view)}"
                          data-index="${slotNumber}"
                        >
                          Bild einfügen
                        </button>
                      </div>
                    </div>
                  `;
                }

                return `
                  <div class="review-image-card">
                    <img src="${item.previewDataUrl}" alt="${Utils.escapeHtml(title)}" />
                    <div class="review-image-meta">
                      <div class="review-image-title">${Utils.escapeHtml(title)}</div>
                      <button
                        class="small-button btn-thermal-import"
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
              .join("")}
          </div>
        </div>
      </div>
    `;
  },

  bind() {
    document
      .getElementById("btn-thermal-to-settings")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.SETTINGS);
      });

    document
      .getElementById("btn-thermal-back-home")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.HOME);
      });

    document
      .getElementById("btn-thermal-back-review")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.REVIEW);
      });

    document.querySelectorAll(".btn-thermal-import").forEach((button) => {
      button.addEventListener("click", () => {
        const view = button.getAttribute("data-view");
        const indexInView = Number(button.getAttribute("data-index"));
        const input = document.getElementById("thermal-file-input");

        if (!input) {
          alert("Dateiauswahl nicht verfügbar.");
          return;
        }

        input.onchange = async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;

          try {
            if (!Utils.fileLooksLikeImage(file)) {
              throw new Error("Bitte eine gültige Bilddatei auswählen.");
            }

            await this.importFile(view, indexInView, file);
            Router.reload();
          } catch (error) {
            console.error(error);
            alert(error.message || "Wärmebild konnte nicht importiert werden.");
          } finally {
            event.target.value = "";
          }
        };

        input.click();
      });
    });
  },

  async importFile(view, indexInView, file) {
    const exam = AppState.currentExam;
    if (!exam) {
      throw new Error("Keine Untersuchung aktiv.");
    }

    const originalDataUrl = await this.readFileAsDataUrl(file);
    const previewDataUrl = await this.createPreviewDataUrl(originalDataUrl, 320);

    const slotDefinition = ThermalSequence.find(
      (item) => item.view === view && item.indexInView === indexInView
    );

    if (!slotDefinition) {
      throw new Error("Ungültiger Wärmebild-Slot.");
    }

    const slotData = {
      slot: slotDefinition.slot,
      view,
      indexInView,
      originalDataUrl,
      previewDataUrl,
      fileName: file.name,
      mimeType: file.type || "image/*",
      importedAt: new Date().toISOString(),
      source: "HIKMICRO Import",
    };

    const savedSet = ThermalStore.saveSlot(exam.id, slotData);
    if (!savedSet) {
      throw new Error("Wärmebild konnte nicht gespeichert werden.");
    }

    const updatedExam = {
      ...exam,
      thermalImageSetId: savedSet.id,
      sections: {
        ...exam.sections,
        thermalImages:
          ThermalStore.countImported(exam.id) > 0 ? "in-progress" : "optional",
      },
    };

    const savedExam = ExamStore.update(updatedExam);
    AppState.currentExam = savedExam || updatedExam;
    AppState.thermalStatus.totalImported = ThermalStore.countImported(exam.id);
  },

  readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
      reader.readAsDataURL(file);
    });
  },

  createPreviewDataUrl(dataUrl, maxWidth = 320) {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        const ratio = image.width > 0 ? maxWidth / image.width : 1;
        const width = Math.max(1, Math.round(image.width * ratio));
        const height = Math.max(1, Math.round(image.height * ratio));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Vorschaubild konnte nicht erzeugt werden."));
          return;
        }

        ctx.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };

      image.onerror = () => reject(new Error("Bilddatei ist beschädigt oder nicht lesbar."));
      image.src = dataUrl;
    });
  },
};