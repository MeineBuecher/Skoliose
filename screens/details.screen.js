const DetailsScreen = {
  title: "Detailanalyse",

  render() {
    const exam = AppState.currentExam;
    if (!exam || !exam.analysisId) {
      return `
        <section class="screen details-screen">
          <div class="card">
            <h2>Detailanalyse</h2>
            <p>Kein Analyseergebnis verfügbar.</p>
            <div class="form-actions">
              <button id="btn-details-back-summary" class="primary-button" type="button">
                Zur Zusammenfassung
              </button>
            </div>
          </div>
        </section>
      `;
    }

    const analysis = AnalysisStore.findByExamId(exam.id);
    if (!analysis) {
      return `
        <section class="screen details-screen">
          <div class="card">
            <h2>Detailanalyse</h2>
            <p>Analyse konnte nicht geladen werden.</p>
            <div class="form-actions">
              <button id="btn-details-back-summary" class="primary-button" type="button">
                Zur Zusammenfassung
              </button>
            </div>
          </div>
        </section>
      `;
    }

    const m = analysis.measurements || {};
    const q = analysis.qualityIndex || {};
    const axes = analysis.axes || {};
    const thermal = analysis.thermalDocumentation || {};

    return `
      <section class="screen details-screen">
        <div class="details-grid">
          <div class="card details-card">
            <h2>Detailanalyse</h2>

            <div class="info-line">
              <span>Untersuchungs-ID</span>
              <strong>${Utils.escapeHtml(exam.examNumber)}</strong>
            </div>

            <div class="info-line">
              <span>Messqualität</span>
              <strong>${Utils.escapeHtml(String(q.overallRating || "-"))}</strong>
            </div>

            <div class="info-line">
              <span>Wärmebildstatus</span>
              <strong>${Utils.escapeHtml(this.getThermalLabel(thermal.documentationStatus))}</strong>
            </div>
          </div>

          <div class="card details-card">
            <h3>Kopf-Balance</h3>

            <div class="details-row">
              <span>Kopfversatz</span>
              <strong>${Utils.escapeHtml(String(m.headOffsetMm ?? "-"))} mm</strong>
            </div>

            <div class="details-row">
              <span>Kopfneigung</span>
              <strong>${Utils.escapeHtml(String(m.headTiltDeg ?? "-"))}°</strong>
            </div>

            <div class="details-row">
              <span>Kieferasymmetrie</span>
              <strong>${Utils.escapeHtml(String(m.jawAsymmetryDeg ?? "-"))}°</strong>
            </div>

            <div class="details-row">
              <span>Vorverlagerung sagittal</span>
              <strong>${Utils.escapeHtml(String(m.sagittalHeadForwardMm ?? "-"))} mm</strong>
            </div>
          </div>

          <div class="card details-card">
            <h3>Schulteranalyse</h3>

            <div class="details-row">
              <span>Schulterdifferenz</span>
              <strong>${Utils.escapeHtml(String(m.shoulderDifferenceMm ?? "-"))} mm</strong>
            </div>

            <div class="details-row">
              <span>Frontalachse</span>
              <strong>${Utils.escapeHtml(String(m.frontalShoulderAxisDeg ?? "-"))}°</strong>
            </div>

            <div class="details-row">
              <span>Posteriorachse</span>
              <strong>${Utils.escapeHtml(String(m.posteriorShoulderAxisDeg ?? "-"))}°</strong>
            </div>

            <div class="details-row">
              <span>Bewertung</span>
              <strong>${Utils.escapeHtml(String(m.shoulderRating || "-"))}</strong>
            </div>
          </div>

          <div class="card details-card">
            <h3>Beckenanalyse</h3>

            <div class="details-row">
              <span>Beckendifferenz</span>
              <strong>${Utils.escapeHtml(String(m.pelvisDifferenceMm ?? "-"))} mm</strong>
            </div>

            <div class="details-row">
              <span>Frontalachse</span>
              <strong>${Utils.escapeHtml(String(m.frontalPelvicAxisDeg ?? "-"))}°</strong>
            </div>

            <div class="details-row">
              <span>Posteriorachse</span>
              <strong>${Utils.escapeHtml(String(m.posteriorPelvicAxisDeg ?? "-"))}°</strong>
            </div>

            <div class="details-row">
              <span>Bewertung</span>
              <strong>${Utils.escapeHtml(String(m.pelvisRating || "-"))}</strong>
            </div>
          </div>

          <div class="card details-card">
            <h3>Rumpfanalyse</h3>

            <div class="details-row">
              <span>Seitabweichung</span>
              <strong>${Utils.escapeHtml(String(m.trunkLateralDeviationMm ?? "-"))} mm</strong>
            </div>

            <div class="details-row">
              <span>Bauchnabelabweichung</span>
              <strong>${Utils.escapeHtml(String(m.navelOffsetMm ?? "-"))} mm</strong>
            </div>

            <div class="details-row">
              <span>Thorax-Pelvis sagittal</span>
              <strong>${Utils.escapeHtml(String(m.sagittalThoraxPelvisShiftMm ?? "-"))} mm</strong>
            </div>

            <div class="details-row">
              <span>Trunk-Achse frontal</span>
              <strong>${Utils.escapeHtml(String(Number(Math.abs(axes.frontal?.trunkAxisDeg || 0).toFixed(1))))}°</strong>
            </div>
          </div>

          <div class="card details-card">
            <h3>Taillen-Asymmetrie</h3>

            <div class="details-row">
              <span>Differenz</span>
              <strong>${Utils.escapeHtml(String(m.waistAsymmetryMm ?? "-"))} mm</strong>
            </div>
          </div>

          <div class="card details-card">
            <h3>Beinachsen</h3>

            <div class="details-row">
              <span>Achsentyp</span>
              <strong>${Utils.escapeHtml(String(m.legAxisCategory || "-"))}</strong>
            </div>

            <div class="details-row">
              <span>Winkelabweichung</span>
              <strong>${Utils.escapeHtml(String(m.legAxisDeg ?? "-"))}°</strong>
            </div>
          </div>

          <div class="card details-card">
            <h3>Fußanalyse</h3>

            <div class="details-row">
              <span>Links Rotation</span>
              <strong>${Utils.escapeHtml(String(m.footRotationLeftDeg ?? "-"))}°</strong>
            </div>

            <div class="details-row">
              <span>Rechts Rotation</span>
              <strong>${Utils.escapeHtml(String(m.footRotationRightDeg ?? "-"))}°</strong>
            </div>
          </div>

          <div class="card details-card">
            <h3>Qualitätsindex</h3>

            <div class="details-row">
              <span>Punktstabilität</span>
              <strong>${Utils.escapeHtml(String(q.pointStability ?? "-"))}</strong>
            </div>

            <div class="details-row">
              <span>Achsstabilität</span>
              <strong>${Utils.escapeHtml(String(q.axisStability ?? "-"))}</strong>
            </div>

            <div class="details-row">
              <span>Messstabilität</span>
              <strong>${Utils.escapeHtml(String(q.measurementStability ?? "-"))}</strong>
            </div>
          </div>

          <div class="card details-card details-highlight">
            <h3>Cobb-Schätzung</h3>

            <div class="details-row">
              <span>Cobb-Winkel</span>
              <strong class="details-value-strong">${Utils.escapeHtml(String(m.estimatedCobbDeg ?? "-"))}°</strong>
            </div>

            <div class="details-row">
              <span>Posture Index</span>
              <strong>${Utils.escapeHtml(String(m.postureIndexScore ?? "-"))}</strong>
            </div>

            <p class="details-text">
              Diese Schätzung basiert auf einer verfeinerten fotobasierten Oberflächenanalyse mit Landmarken-, Achsen- und Symmetrie-Logik.
            </p>
          </div>

          <div class="card details-actions">
            <button id="btn-details-back-summary" class="secondary-button" type="button">
              Zusammenfassung
            </button>

            <div class="details-actions-grid">
              <button id="btn-details-spine3d" class="secondary-button" type="button">
                3D Wirbelsäule
              </button>

              <button id="btn-details-images" class="secondary-button" type="button">
                Bilder
              </button>
            </div>

            <button id="btn-details-report" class="primary-button" type="button">
              PDF Bericht
            </button>
          </div>
        </div>
      </section>
    `;
  },

  bind() {
    document
      .getElementById("btn-details-back-summary")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.SUMMARY);
      });

    document
      .getElementById("btn-details-spine3d")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.SPINE3D);
      });

    document
      .getElementById("btn-details-images")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.IMAGES);
      });

    document
      .getElementById("btn-details-report")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.REPORT);
      });
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