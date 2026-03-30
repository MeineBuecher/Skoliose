const SummaryScreen = {
  title: "Ergebnis",

  render() {
    if (!Guards.canOpenResults()) {
      return Utils.makeErrorCard(
        "Ergebnis",
        "Kein fertiges Analyseergebnis verfügbar.",
        "btn-summary-back-home",
        "Zur Startseite"
      );
    }

    const exam = AppState.currentExam;
    const analysis = Guards.getCurrentAnalysis();

    if (!exam || !analysis) {
      return Utils.makeErrorCard(
        "Ergebnis",
        "Analyse konnte nicht geladen werden.",
        "btn-summary-back-review",
        "Zur Prüfseite"
      );
    }

    const risk = analysis.riskAssessment || {};
    const summary = analysis.summary || {};
    const measurements = analysis.measurements || {};
    const quality = analysis.qualityIndex || {};
    const thermal = analysis.thermalDocumentation || {};
    const recommendations = analysis.recommendations || {};
    const evaluationText = risk.explanationLong || "Keine Bewertung verfügbar.";
    const recommendationText =
      AppState.reportMode === "laie"
        ? Utils.safeArray(recommendations.layMode).join(" ")
        : Utils.safeArray(recommendations.professionalMode).join(" ");

    return `
      <section class="screen summary-screen">
        <div class="summary-grid">
          <div class="card summary-traffic-card">
            <h2>Ergebnis</h2>

            <div class="summary-traffic-top">
              <div class="summary-traffic-circle ${this.getTrafficClass(risk.trafficLight)}"></div>

              <div class="summary-traffic-text">
                <div class="summary-traffic-label">Risiko</div>
                <div class="summary-traffic-value">${Utils.escapeHtml(this.getRiskLabel(risk.riskLevel))}</div>
                <div class="summary-text">${Utils.escapeHtml(summary.mainResult || "")}</div>
              </div>
            </div>
          </div>

          <div class="card summary-card">
            <h3>Messqualität</h3>

            <div class="summary-row">
              <span>Messqualität</span>
              <strong>${Utils.escapeHtml(String(quality.overallRating || "-"))}</strong>
            </div>

            <div class="summary-row">
              <span>Reproduzierbarkeit</span>
              <strong>${Utils.escapeHtml(String(quality.reproducibilityPercent ?? "-"))} %</strong>
            </div>

            <div class="summary-row">
              <span>Wiederholung empfohlen</span>
              <strong>${Utils.escapeHtml(String(quality.repeatRecommendation || "nein"))}</strong>
            </div>
          </div>

          <div class="card summary-card">
            <h3>Wärmebild-Dokumentation</h3>

            <div class="summary-row">
              <span>Status</span>
              <strong>${Utils.escapeHtml(this.getThermalLabel(thermal.documentationStatus))}</strong>
            </div>

            <div class="summary-row">
              <span>Importiert</span>
              <strong>${Utils.escapeHtml(String(thermal.importedCount ?? 0))} / ${Utils.escapeHtml(String(thermal.expectedCount ?? 9))}</strong>
            </div>

            <div class="summary-row">
              <span>Quelle</span>
              <strong>${Utils.escapeHtml(String(thermal.source || "-"))}</strong>
            </div>
          </div>

          <div class="card summary-card">
            <h3>Wichtige Werte</h3>

            <div class="summary-row">
              <span>Schulterdifferenz</span>
              <strong>${Utils.escapeHtml(String(measurements.shoulderDifferenceMm ?? "-"))} mm</strong>
            </div>

            <div class="summary-row">
              <span>Beckendifferenz</span>
              <strong>${Utils.escapeHtml(String(measurements.pelvisDifferenceMm ?? "-"))} mm</strong>
            </div>

            <div class="summary-row">
              <span>Kopfversatz</span>
              <strong>${Utils.escapeHtml(String(measurements.headOffsetMm ?? "-"))} mm</strong>
            </div>

            <div class="summary-row">
              <span>Cobb-Schätzung</span>
              <strong>${Utils.escapeHtml(String(measurements.estimatedCobbDeg ?? "-"))}°</strong>
            </div>
          </div>

          <div class="card summary-card">
            <h3>Bewertung</h3>
            <p class="summary-text">${Utils.escapeHtml(evaluationText)}</p>
          </div>

          <div class="card summary-card">
            <h3>Empfehlung</h3>
            <p class="summary-text">${Utils.escapeHtml(recommendationText || "Keine Empfehlung verfügbar.")}</p>
          </div>

          <div class="card summary-actions">
            <button id="btn-summary-details" class="secondary-button" type="button">
              Details
            </button>

            <div class="summary-actions-grid">
              <button id="btn-summary-spine3d" class="secondary-button" type="button">
                3D Wirbelsäule
              </button>

              <button id="btn-summary-images" class="secondary-button" type="button">
                Bilder
              </button>
            </div>

            <button id="btn-summary-report" class="primary-button" type="button">
              PDF Bericht
            </button>

            <button id="btn-summary-comparison" class="secondary-button" type="button">
              Vergleich
            </button>

            <button id="btn-summary-back-review" class="secondary-button" type="button">
              Zur Prüfseite
            </button>
          </div>
        </div>
      </section>
    `;
  },

  bind() {
    document
      .getElementById("btn-summary-back-home")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.HOME);
      });

    document
      .getElementById("btn-summary-back-review")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.REVIEW);
      });

    document
      .getElementById("btn-summary-details")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.DETAILS);
      });

    document
      .getElementById("btn-summary-spine3d")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.SPINE3D);
      });

    document
      .getElementById("btn-summary-images")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.IMAGES);
      });

    document
      .getElementById("btn-summary-report")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.REPORT);
      });

    document
      .getElementById("btn-summary-comparison")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.COMPARISON);
      });
  },

  getTrafficClass(trafficLight) {
    switch (trafficLight) {
      case "green":
        return "summary-traffic-green";
      case "orange":
        return "summary-traffic-orange";
      case "red":
        return "summary-traffic-red";
      case "yellow":
      default:
        return "summary-traffic-yellow";
    }
  },

  getRiskLabel(riskLevel) {
    switch (riskLevel) {
      case "niedrig":
        return "Niedrig";
      case "deutlich-auffaellig":
        return "Deutlich auffällig";
      case "stark-abklaerungsbeduerftig":
        return "Stark abklärungsbedürftig";
      case "auffaellig":
      default:
        return "Auffällig";
    }
  },

  getThermalLabel(status) {
    switch (status) {
      case "disabled":
        return "Deaktiviert";
      case "complete":
        return "Vollständig";
      case "partial":
        return "Teilweise";
      case "not-used":
      default:
        return "Nicht genutzt";
    }
  },
};