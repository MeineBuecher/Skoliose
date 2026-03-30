const HomeScreen = {
  title: "Startseite",

  render() {
    try {
      const next =
        typeof Guards !== "undefined" && Guards.getBestHomeAction
          ? Guards.getBestHomeAction()
          : {
              label: "Patient auswählen",
              route: Routes.PATIENTS,
              text: "Noch kein Patient aktiv.",
            };

      const patient = AppState.currentPatient || null;
      const exam = AppState.currentExam || null;

      const captured =
        typeof Guards !== "undefined" && Guards.getCapturedCount
          ? Guards.getCapturedCount()
          : 0;

      const thermal =
        typeof Guards !== "undefined" && Guards.getThermalCount
          ? Guards.getThermalCount()
          : 0;

      const hasAnalysis =
        typeof Guards !== "undefined" && Guards.hasAnalysis
          ? Guards.hasAnalysis()
          : false;

      const canReview =
        typeof Guards !== "undefined" && Guards.canOpenReview
          ? Guards.canOpenReview()
          : false;

      const canResults =
        typeof Guards !== "undefined" && Guards.canOpenResults
          ? Guards.canOpenResults()
          : false;

      return `
        <section class="screen home-screen">
          <div class="card">
            <div class="app-cover">Skoliose<br>Analyse</div>
            <h2>Startseite</h2>
            <p>${Utils.escapeHtml(next.text || "Willkommen.")}</p>
          </div>

          <div class="card">
            <h3>Aktueller Stand</h3>

            <div class="info-line">
              <span>Patient</span>
              <strong>${patient ? `${Utils.escapeHtml(patient.firstName)} ${Utils.escapeHtml(patient.lastName)}` : "-"}</strong>
            </div>

            <div class="info-line">
              <span>Patientennummer</span>
              <strong>${patient ? Utils.escapeHtml(patient.patientNumber) : "-"}</strong>
            </div>

            <div class="info-line">
              <span>Untersuchung</span>
              <strong>${exam ? Utils.escapeHtml(exam.examNumber) : "-"}</strong>
            </div>

            <div class="info-line">
              <span>Standardbilder</span>
              <strong>${exam ? `${captured} / 12` : "-"}</strong>
            </div>

            <div class="info-line">
              <span>Wärmebilder</span>
              <strong>${exam ? `${thermal} / 9` : "-"}</strong>
            </div>

            <div class="info-line">
              <span>Analyse</span>
              <strong>${hasAnalysis ? "abgeschlossen" : exam ? "offen" : "-"}</strong>
            </div>
          </div>

          <div class="card">
            <div class="main-menu">
              <button id="btn-home-primary" class="primary-button" type="button">
                ${Utils.escapeHtml(next.label || "Patient auswählen")}
              </button>

              <button id="btn-home-patients" class="secondary-button" type="button">
                Patienten
              </button>

              <button id="btn-home-review" class="secondary-button" type="button" ${canReview ? "" : "disabled"}>
                Prüfseite
              </button>

              <button id="btn-home-results" class="secondary-button" type="button" ${canResults ? "" : "disabled"}>
                Ergebnisse
              </button>
            </div>
          </div>
        </section>
      `;
    } catch (error) {
      console.error("HomeScreen.render failed:", error);

      return `
        <section class="screen home-screen">
          <div class="card">
            <div class="app-cover">Skoliose<br>Analyse</div>
            <h2>Startseite</h2>
            <p>Die Startseite konnte nicht vollständig aufgebaut werden.</p>
          </div>

          <div class="card">
            <div class="main-menu">
              <button id="btn-home-fallback-patients" class="primary-button" type="button">
                Patienten
              </button>

              <button id="btn-home-fallback-settings" class="secondary-button" type="button">
                Einstellungen
              </button>
            </div>
          </div>

          <div class="card">
            <p class="capture-note capture-error">
              Fehler: ${Utils.escapeHtml(error?.message || "Unbekannter Fehler")}
            </p>
          </div>
        </section>
      `;
    }
  },

  bind() {
    document.getElementById("btn-home-primary")?.addEventListener("click", () => {
      App.goToBestNextStep();
    });

    document.getElementById("btn-home-patients")?.addEventListener("click", () => {
      Router.goTo(Routes.PATIENTS);
    });

    document.getElementById("btn-home-review")?.addEventListener("click", () => {
      Router.goTo(Routes.REVIEW);
    });

    document.getElementById("btn-home-results")?.addEventListener("click", () => {
      Router.goTo(Routes.SUMMARY);
    });

    document.getElementById("btn-home-fallback-patients")?.addEventListener("click", () => {
      Router.goTo(Routes.PATIENTS);
    });

    document.getElementById("btn-home-fallback-settings")?.addEventListener("click", () => {
      Router.goTo(Routes.SETTINGS);
    });
  },
};