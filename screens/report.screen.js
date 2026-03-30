const ReportScreen = {
  title: "Bericht",

  render() {
    const exam = AppState.currentExam;
    const patient = AppState.currentPatient;
    const settings = SettingsStore.get();

    if (!exam || !patient || !exam.analysisId) {
      return Utils.makeErrorCard(
        "Bericht",
        "Bericht erst nach abgeschlossener Analyse verfügbar.",
        "btn-report-back-summary",
        "Zur Zusammenfassung"
      );
    }

    const analysis = AnalysisStore.findByExamId(exam.id);
    if (!analysis) {
      return Utils.makeErrorCard(
        "Bericht",
        "Analyse konnte nicht geladen werden.",
        "btn-report-back-summary",
        "Zur Zusammenfassung"
      );
    }

    return `
      <section class="screen report-screen">
        <div class="report-layout">
          <div class="card report-actions-card">
            <h2>Bericht</h2>

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
              <span>Berichtsmodus</span>
              <strong>${Utils.escapeHtml(AppState.reportMode)}</strong>
            </div>

            <div class="info-line">
              <span>Wärmebilder</span>
              <strong>${settings.thermalEnabled ? `${ThermalStore.countImported(exam.id)} / 9` : "deaktiviert"}</strong>
            </div>

            <div class="form-actions">
              <button id="btn-generate-report" class="primary-button" type="button">
                Bericht speichern
              </button>

              <button id="btn-print-report" class="secondary-button" type="button">
                PDF erzeugen / Drucken
              </button>

              <button id="btn-report-back-summary" class="secondary-button" type="button">
                Zusammenfassung
              </button>

              <button id="btn-report-comparison" class="secondary-button" type="button">
                Vergleich
              </button>
            </div>
          </div>

          <div class="card report-preview-card">
            <h3>Berichtsvorschau</h3>
            <div id="report-preview-content">
              ${this.buildInitialReportShell()}
            </div>
          </div>
        </div>
      </section>
    `;
  },

  async bind() {
    document
      .getElementById("btn-report-back-summary")
      ?.addEventListener("click", () => Router.goTo(Routes.SUMMARY));

    document
      .getElementById("btn-report-comparison")
      ?.addEventListener("click", () => Router.goTo(Routes.COMPARISON));

    document
      .getElementById("btn-generate-report")
      ?.addEventListener("click", async () => {
        await this.saveReport();
      });

    document
      .getElementById("btn-print-report")
      ?.addEventListener("click", async () => {
        await this.ensurePreviewReady();
        this.printReport();
      });

    await this.ensurePreviewReady();
  },

  buildInitialReportShell() {
    return `
      <div class="report-document">
        <div class="report-section">
          <h2>Bericht wird aufgebaut…</h2>
          <div class="report-note">Overlay-Bilder werden vorbereitet.</div>
        </div>
      </div>
    `;
  },

  async ensurePreviewReady() {
    const exam = AppState.currentExam;
    const patient = AppState.currentPatient;
    const settings = SettingsStore.get();
    if (!exam || !patient) return;

    const analysis = AnalysisStore.findByExamId(exam.id);
    if (!analysis) return;

    const container = document.getElementById("report-preview-content");
    if (!container) return;

    try {
      const content = await this.buildReportHtml(patient, exam, analysis, settings);
      container.innerHTML = content;
    } catch (error) {
      console.error(error);
      container.innerHTML = `
        <div class="report-document">
          <div class="report-section">
            <h2>Bericht</h2>
            <div class="report-note">Berichtsvorschau konnte nicht vollständig aufgebaut werden.</div>
          </div>
        </div>
      `;
    }
  },

  async buildReportHtml(patient, exam, analysis, settings) {
    const risk = analysis.riskAssessment || {};
    const quality = analysis.qualityIndex || {};
    const thermal = analysis.thermalDocumentation || {};
    const measurements = analysis.measurements || {};
    const recommendations = analysis.recommendations || {};
    const reportMode = AppState.reportMode || "fachkraft";
    const thermalSet = settings.thermalEnabled ? ThermalStore.getByExamId(exam.id) : null;

    const recommendationText =
      reportMode === "laie"
        ? Utils.safeArray(recommendations.layMode).join(" ")
        : Utils.safeArray(recommendations.professionalMode).join(" ");

    const imageSet = ImageStore.getByExamId(exam.id);
    const standardImagesHtml = await this.buildImagesHtml(imageSet, exam.id);

    return `
      <div class="report-document" id="report-document">
        <div class="report-section">
          <h1>Skoliose Analyse Bericht</h1>
          <div class="report-subtitle">Fotobasierte Haltungsanalyse</div>
        </div>

        <div class="report-section">
          <h2>Patientendaten</h2>
          <div class="report-row"><span>Name</span><strong>${Utils.escapeHtml(patient.firstName)} ${Utils.escapeHtml(patient.lastName)}</strong></div>
          <div class="report-row"><span>Patientennummer</span><strong>${Utils.escapeHtml(patient.patientNumber)}</strong></div>
          <div class="report-row"><span>Geburtsdatum</span><strong>${Utils.escapeHtml(patient.birthDate || "-")}</strong></div>
          <div class="report-row"><span>Alter</span><strong>${Utils.escapeHtml(String(patient.ageYears ?? "-"))}</strong></div>
          <div class="report-row"><span>Geschlecht</span><strong>${Utils.escapeHtml(String(patient.gender || "-"))}</strong></div>
          <div class="report-row"><span>Größe</span><strong>${Utils.escapeHtml(String(patient.heightCm ?? "-"))} cm</strong></div>
          <div class="report-row"><span>Gewicht</span><strong>${Utils.escapeHtml(String(patient.weightKg ?? "-"))} kg</strong></div>
          <div class="report-row"><span>BMI</span><strong>${Utils.escapeHtml(String(patient.bmi ?? "-"))}</strong></div>
          <div class="report-row"><span>Untersuchungs-ID</span><strong>${Utils.escapeHtml(exam.examNumber)}</strong></div>
          <div class="report-row"><span>Datum</span><strong>${Utils.escapeHtml(exam.date || "-")}</strong></div>
        </div>

        <div class="report-section">
          <h2>Zusammenfassung</h2>
          <div class="report-row"><span>Risiko</span><strong>${Utils.escapeHtml(this.getRiskLabel(risk.riskLevel))}</strong></div>
          <div class="report-row"><span>Messqualität</span><strong>${Utils.escapeHtml(String(quality.overallRating || "-"))}</strong></div>
          <div class="report-row"><span>Reproduzierbarkeit</span><strong>${Utils.escapeHtml(String(quality.reproducibilityPercent ?? "-"))} %</strong></div>
          <div class="report-row"><span>Cobb-Schätzung</span><strong>${Utils.escapeHtml(String(measurements.estimatedCobbDeg ?? "-"))}°</strong></div>
          <div class="report-note">${Utils.escapeHtml(risk.explanationLong || "")}</div>
        </div>

        <div class="report-section">
          <h2>Wärmebild-Dokumentation</h2>
          <div class="report-row"><span>Status</span><strong>${Utils.escapeHtml(this.getThermalLabel(thermal.documentationStatus))}</strong></div>
          <div class="report-row"><span>Importiert</span><strong>${Utils.escapeHtml(String(thermal.importedCount ?? 0))} / ${Utils.escapeHtml(String(thermal.expectedCount ?? 9))}</strong></div>
          <div class="report-row"><span>Quelle</span><strong>${Utils.escapeHtml(String(thermal.source || "-"))}</strong></div>
          <div class="report-note">${Utils.escapeHtml(String(thermal.interpretationNote || ""))}</div>
        </div>

        <div class="report-section">
          <h2>Detailanalyse</h2>
          <div class="report-row"><span>Schulterdifferenz</span><strong>${Utils.escapeHtml(String(measurements.shoulderDifferenceMm ?? "-"))} mm</strong></div>
          <div class="report-row"><span>Beckendifferenz</span><strong>${Utils.escapeHtml(String(measurements.pelvisDifferenceMm ?? "-"))} mm</strong></div>
          <div class="report-row"><span>Kopfversatz</span><strong>${Utils.escapeHtml(String(measurements.headOffsetMm ?? "-"))} mm</strong></div>
          <div class="report-row"><span>Kopfneigung</span><strong>${Utils.escapeHtml(String(measurements.headTiltDeg ?? "-"))}°</strong></div>
          <div class="report-row"><span>Bauchnabelabweichung</span><strong>${Utils.escapeHtml(String(measurements.navelOffsetMm ?? "-"))} mm</strong></div>
          <div class="report-row"><span>Rumpfseitabweichung</span><strong>${Utils.escapeHtml(String(measurements.trunkLateralDeviationMm ?? "-"))} mm</strong></div>
          <div class="report-row"><span>Taillen-Asymmetrie</span><strong>${Utils.escapeHtml(String(measurements.waistAsymmetryMm ?? "-"))} mm</strong></div>
          <div class="report-row"><span>Beinachsen</span><strong>${Utils.escapeHtml(String(measurements.legAxisCategory || "-"))}</strong></div>
          <div class="report-row"><span>Fußrotation links</span><strong>${Utils.escapeHtml(String(measurements.footRotationLeftDeg ?? "-"))}°</strong></div>
          <div class="report-row"><span>Fußrotation rechts</span><strong>${Utils.escapeHtml(String(measurements.footRotationRightDeg ?? "-"))}°</strong></div>
        </div>

        <div class="report-section">
          <h2>Empfehlung</h2>
          <div class="report-note">${Utils.escapeHtml(recommendationText || "Keine Empfehlung verfügbar.")}</div>
        </div>

        <div class="report-section">
          <h2>Standardbilder mit Overlay</h2>
          ${standardImagesHtml}
        </div>

        ${
          settings.thermalEnabled
            ? `
        <div class="report-section">
          <h2>Wärmebilder</h2>
          ${this.buildThermalHtml(thermalSet)}
        </div>
        `
            : ""
        }
      </div>
    `;
  },

  async buildImagesHtml(imageSet, examId) {
    if (!imageSet) {
      return `<div class="report-note">Keine Bilder verfügbar.</div>`;
    }

    const groups = [
      { key: "front", label: "Vorne" },
      { key: "back", label: "Hinten" },
      { key: "left", label: "Links" },
      { key: "right", label: "Rechts" },
    ];

    const groupHtmlList = [];

    for (const group of groups) {
      const items = imageSet.views[group.key] || [];
      const cards = [];

      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];

        if (!item) {
          cards.push(`
            <div class="report-image-card">
              <div class="report-image-missing">Fehlt</div>
              <div class="report-image-label">${Utils.escapeHtml(group.label)} ${index + 1}</div>
            </div>
          `);
          continue;
        }

        let overlayUrl = item.filePreview || "";
        try {
          overlayUrl = await ReportOverlayRenderer.createOverlayDataUrl(
            item.fileOriginal || item.filePreview,
            group.key,
            item.slot,
            examId,
            900
          );
        } catch (error) {
          console.error("Overlay render failed:", error);
        }

        cards.push(`
          <div class="report-image-card">
            <img src="${overlayUrl}" alt="${Utils.escapeHtml(group.label)} ${index + 1}" />
            <div class="report-image-label">${Utils.escapeHtml(group.label)} ${index + 1}</div>
          </div>
        `);
      }

      groupHtmlList.push(`
        <div class="report-image-group">
          <h3>${Utils.escapeHtml(group.label)}</h3>
          <div class="report-image-grid">
            ${cards.join("")}
          </div>
        </div>
      `);
    }

    return groupHtmlList.join("");
  },

  buildThermalHtml(thermalSet) {
    if (!thermalSet || ThermalStore.countImported(thermalSet.examId) === 0) {
      return `<div class="report-note">Keine Wärmebilder eingefügt.</div>`;
    }

    const groups = [
      { key: "back", label: "Hinten" },
      { key: "left45", label: "Links 45°" },
      { key: "right45", label: "Rechts 45°" },
    ];

    return groups
      .map((group) => {
        const items = thermalSet.views[group.key] || [];
        const cards = items
          .map((item, index) => {
            if (!item) {
              return `
                <div class="report-image-card">
                  <div class="report-image-missing">Fehlt</div>
                  <div class="report-image-label">${Utils.escapeHtml(group.label)} ${index + 1}</div>
                </div>
              `;
            }

            return `
              <div class="report-image-card">
                <img src="${item.previewDataUrl}" alt="${Utils.escapeHtml(group.label)} ${index + 1}" />
                <div class="report-image-label">${Utils.escapeHtml(group.label)} ${index + 1}</div>
              </div>
            `;
          })
          .join("");

        return `
          <div class="report-image-group">
            <h3>${Utils.escapeHtml(group.label)}</h3>
            <div class="report-image-grid">
              ${cards}
            </div>
          </div>
        `;
      })
      .join("");
  },

  async saveReport() {
    const exam = AppState.currentExam;
    const patient = AppState.currentPatient;
    const analysis = exam ? AnalysisStore.findByExamId(exam.id) : null;
    const settings = SettingsStore.get();

    if (!exam || !patient || !analysis) {
      alert("Bericht konnte nicht gespeichert werden.");
      return;
    }

    try {
      const htmlContent = await this.buildReportHtml(patient, exam, analysis, settings);
      const existing = ReportStore.findByExamId(exam.id);

      const report = existing
        ? {
            ...existing,
            mode: AppState.reportMode,
            htmlContent,
            includedSections: {
              ...existing.includedSections,
              thermalImages: settings.thermalEnabled,
            },
          }
        : {
            ...ReportStore.create(exam.id, AppState.reportMode, htmlContent),
            includedSections: {
              patientData: true,
              standardImages: true,
              thermalImages: settings.thermalEnabled,
              measurements: true,
              qualityIndex: true,
              spine3D: true,
              comparison: false,
            },
          };

      ReportStore.save(report);

      const updatedExam = {
        ...exam,
        reportId: report.id,
        sections: {
          ...exam.sections,
          report: "generated",
        },
      };

      const savedExam = ExamStore.update(updatedExam);
      AppState.currentExam = savedExam || updatedExam;

      alert("Bericht wurde gespeichert.");
    } catch (error) {
      console.error(error);
      alert("Bericht konnte nicht gespeichert werden.");
    }
  },

  printReport() {
    const reportContent = document.getElementById("report-preview-content");
    if (!reportContent) {
      alert("Berichtsvorschau nicht verfügbar.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=1200");
    if (!printWindow) {
      alert("Druckfenster konnte nicht geöffnet werden.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <title>Skoliose Bericht</title>
        <style>
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #111827;
            margin: 24px;
            line-height: 1.4;
          }
          .report-document {
            max-width: 900px;
            margin: 0 auto;
          }
          .report-section {
            margin-bottom: 28px;
            page-break-inside: avoid;
          }
          .report-section h1 {
            margin: 0 0 8px;
            font-size: 28px;
          }
          .report-section h2 {
            margin: 0 0 12px;
            font-size: 20px;
            border-bottom: 2px solid #dbeafe;
            padding-bottom: 6px;
          }
          .report-section h3 {
            margin: 0 0 10px;
            font-size: 16px;
          }
          .report-subtitle {
            color: #4b5563;
            margin-bottom: 12px;
          }
          .report-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding: 7px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .report-note {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 12px;
          }
          .report-image-group {
            margin-bottom: 18px;
          }
          .report-image-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
          .report-image-card {
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            overflow: hidden;
            background: #ffffff;
          }
          .report-image-card img {
            width: 100%;
            display: block;
          }
          .report-image-label {
            padding: 8px;
            font-size: 12px;
            font-weight: bold;
          }
          .report-image-missing {
            min-height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f3f4f6;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        ${reportContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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