const SettingsScreen = {
  title: "Einstellungen",

  render() {
    const settings = SettingsStore.get();

    return `
      <section class="screen settings-screen">
        <div class="settings-layout">
          <div class="card settings-card">
            <h2>Einstellungen</h2>

            <div class="form-group">
              <label for="settings-camera-default">Standardkamera</label>
              <select id="settings-camera-default">
                <option value="environment-camera" ${settings.defaultCamera === "environment-camera" ? "selected" : ""}>
                  Rückkamera
                </option>
                <option value="user-camera" ${settings.defaultCamera === "user-camera" ? "selected" : ""}>
                  Frontkamera
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="settings-default-mode">Standardmodus</label>
              <select id="settings-default-mode">
                <option value="fachkraft" ${settings.defaultMode === "fachkraft" ? "selected" : ""}>
                  Fachkraft
                </option>
                <option value="laie" ${settings.defaultMode === "laie" ? "selected" : ""}>
                  Laie
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="settings-thermal-enabled">Wärmebildfunktion</label>
              <select id="settings-thermal-enabled">
                <option value="true" ${settings.thermalEnabled ? "selected" : ""}>
                  Aktiviert
                </option>
                <option value="false" ${!settings.thermalEnabled ? "selected" : ""}>
                  Deaktiviert
                </option>
              </select>
            </div>

            <div class="form-actions">
              <button id="btn-settings-save" class="primary-button" type="button">
                Einstellungen speichern
              </button>
            </div>
          </div>

          <div class="card settings-card">
            <h3>Daten</h3>

            <div class="form-actions">
              <button id="btn-settings-export" class="secondary-button" type="button">
                Backup erstellen
              </button>

              <button id="btn-settings-import" class="secondary-button" type="button">
                Backup importieren
              </button>

              <input id="settings-import-file" type="file" accept=".json,application/json" class="hidden" />
            </div>
          </div>

          <div class="card settings-card">
            <h3>Sitzung</h3>
            <p class="settings-text">
              Die App merkt sich automatisch den letzten Stand der Untersuchung und öffnet ihn beim nächsten Start erneut.
            </p>

            <div class="form-actions">
              <button id="btn-settings-clear-session" class="secondary-button" type="button">
                Letzten Stand verwerfen
              </button>
            </div>
          </div>

          <div class="card settings-card">
            <h3>App-Bild</h3>
            <div class="settings-app-image">
              Skoliose<br>Analyse
            </div>
          </div>

          <div class="card settings-card">
            <h3>App-Information</h3>

            <div class="info-line">
              <span>Version</span>
              <strong>${Utils.escapeHtml(settings.appVersion)}</strong>
            </div>

            <div class="info-line">
              <span>Build</span>
              <strong>${Utils.escapeHtml(settings.buildLabel)}</strong>
            </div>
          </div>

          <div class="card settings-card">
            <h3>Reset</h3>
            <p class="settings-text">
              Löscht alle lokal gespeicherten Patienten, Untersuchungen, Bilder, Analysen und Berichte.
            </p>

            <div class="form-actions">
              <button id="btn-settings-reset" class="danger-button" type="button">
                Alle Daten löschen
              </button>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  bind() {
    document
      .getElementById("btn-settings-save")
      ?.addEventListener("click", () => {
        const defaultCamera =
          document.getElementById("settings-camera-default")?.value || "environment-camera";
        const defaultMode =
          document.getElementById("settings-default-mode")?.value || "fachkraft";
        const thermalEnabled =
          document.getElementById("settings-thermal-enabled")?.value === "true";

        const saved = SettingsStore.updatePartial({
          defaultCamera,
          defaultMode,
          thermalEnabled,
        });

        AppState.reportMode = saved.defaultMode;
        SessionStore.syncFromAppState();
        alert("Einstellungen wurden gespeichert.");
      });

    document
      .getElementById("btn-settings-export")
      ?.addEventListener("click", () => {
        const data = SettingsStore.exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "skoliose_backup.json";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      });

    document
      .getElementById("btn-settings-import")
      ?.addEventListener("click", () => {
        document.getElementById("settings-import-file")?.click();
      });

    document
      .getElementById("settings-import-file")
      ?.addEventListener("change", async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
          const text = await file.text();
          const json = JSON.parse(text);
          SettingsStore.importAllData(json);

          App.resetRuntimeState();
          SessionStore.clear();
          SessionStore.syncFromAppState();

          alert("Backup wurde importiert.");
          Router.currentParams = {};
          Router.loadScreen(Routes.HOME);
          App.updateHeaderButtons();
        } catch (error) {
          console.error(error);
          alert("Backup konnte nicht importiert werden.");
        } finally {
          event.target.value = "";
        }
      });

    document
      .getElementById("btn-settings-clear-session")
      ?.addEventListener("click", () => {
        const confirmed = window.confirm("Letzten Sitzungsstand wirklich verwerfen?");
        if (!confirmed) return;

        SessionStore.clear();
        App.resetRuntimeState();
        SessionStore.syncFromAppState();
        alert("Letzter Stand wurde verworfen.");
        Router.currentParams = {};
        Router.loadScreen(Routes.HOME);
        App.updateHeaderButtons();
      });

    document
      .getElementById("btn-settings-reset")
      ?.addEventListener("click", () => {
        const confirmed = window.confirm("Alle Daten wirklich löschen?");
        if (!confirmed) return;

        SettingsStore.clearAllData();
        SessionStore.clear();
        App.clearSessionAndGoHome();
        alert("Alle Daten wurden gelöscht.");
      });
  },
};