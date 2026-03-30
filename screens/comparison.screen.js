const ComparisonScreen = {
  title: "Verlauf / Vergleich",

  render() {
    const patient = AppState.currentPatient;
    const currentExam = AppState.currentExam;

    if (!patient || !currentExam) {
      return Utils.makeErrorCard(
        "Verlauf / Vergleich",
        "Keine Untersuchung aktiv.",
        "btn-comparison-back-home",
        "Zur Startseite"
      );
    }

    const exams = Utils.safeArray(ExamStore.getByPatientId(patient.id))
      .sort((a, b) => Utils.toNumber(b.sequencePerPatient) - Utils.toNumber(a.sequencePerPatient))
      .slice(0, 3);

    if (exams.length < 2) {
      return Utils.makeErrorCard(
        "Verlauf / Vergleich",
        "Für einen Vergleich sind mindestens zwei Untersuchungen erforderlich.",
        "btn-comparison-back-summary",
        "Zur Zusammenfassung"
      );
    }

    return `
      <section class="screen comparison-screen">
        <div class="comparison-layout">
          <div class="card comparison-card">
            <h2>Verlauf / Vergleich</h2>

            <div class="comparison-exams">
              ${exams
                .map((exam, index) => {
                  const label = this.getExamLabel(index);
                  return `
                    <div class="comparison-exam-box">
                      <div class="comparison-exam-date">${Utils.escapeHtml(this.formatDate(exam.date))}</div>
                      <div class="comparison-exam-label">${Utils.escapeHtml(label)}</div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>

          <div class="card comparison-card">
            <h3>Cobb-Verlauf</h3>
            <div class="comparison-chart-stage">
              <canvas id="comparison-chart-canvas" width="700" height="260"></canvas>
            </div>
          </div>

          <div class="card comparison-card">
            <h3>Messwerte</h3>
            ${this.renderMeasurementsTable(exams)}
          </div>

          <div class="card comparison-card">
            <h3>Wärmebild-Dokumentation</h3>
            ${this.renderThermalTable(exams)}
          </div>

          <div class="card comparison-card">
            <h3>Bildvergleich Vorderansicht</h3>
            <div class="comparison-image-grid">
              ${this.renderComparisonImages(exams)}
            </div>
          </div>

          <div class="card comparison-card">
            <h3>Wärmebildvergleich – Hinten</h3>
            ${this.renderThermalGroupCompare(exams, "back", "Hinten")}
          </div>

          <div class="card comparison-card">
            <h3>Wärmebildvergleich – Links 45°</h3>
            ${this.renderThermalGroupCompare(exams, "left45", "Links 45°")}
          </div>

          <div class="card comparison-card">
            <h3>Wärmebildvergleich – Rechts 45°</h3>
            ${this.renderThermalGroupCompare(exams, "right45", "Rechts 45°")}
          </div>

          <div class="card">
            <div class="comparison-actions-grid">
              <button id="btn-comparison-back-summary" class="secondary-button" type="button">
                Zusammenfassung
              </button>
              <button id="btn-comparison-report" class="primary-button" type="button">
                PDF Bericht
              </button>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  bind() {
    document
      .getElementById("btn-comparison-back-home")
      ?.addEventListener("click", () => Router.goTo(Routes.HOME));

    document
      .getElementById("btn-comparison-back-summary")
      ?.addEventListener("click", () => Router.goTo(Routes.SUMMARY));

    document
      .getElementById("btn-comparison-report")
      ?.addEventListener("click", () => Router.goTo(Routes.REPORT));

    this.drawChart();
  },

  drawChart() {
    const patient = AppState.currentPatient;
    if (!patient) return;

    const exams = Utils.safeArray(ExamStore.getByPatientId(patient.id))
      .sort((a, b) => Utils.toNumber(a.sequencePerPatient) - Utils.toNumber(b.sequencePerPatient))
      .slice(-3);

    const canvas = document.getElementById("comparison-chart-canvas");
    if (!canvas || exams.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const points = exams.map((exam, index) => {
      const analysis = AnalysisStore.findByExamId(exam.id);
      return {
        label: this.formatDate(exam.date),
        value: Utils.toNumber(analysis?.measurements?.estimatedCobbDeg, 0),
        index,
      };
    });

    const padding = { top: 30, right: 30, bottom: 45, left: 45 };
    const maxValue = Math.max(...points.map((p) => p.value), 10);
    const minValue = Math.min(...points.map((p) => p.value), 0);
    const chartWidth = canvas.width - padding.left - padding.right;
    const chartHeight = canvas.height - padding.top - padding.bottom;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i += 1) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(canvas.width - padding.right, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 3;
    ctx.beginPath();

    points.forEach((point, index) => {
      const x =
        padding.left +
        (points.length === 1 ? 0 : (chartWidth / (points.length - 1)) * index);
      const y =
        padding.top +
        chartHeight -
        ((point.value - minValue) / Math.max(1, maxValue - minValue)) * chartHeight;

      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);

      point.x = x;
      point.y = y;
    });

    ctx.stroke();

    points.forEach((point) => {
      ctx.fillStyle = "#2563eb";
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#111827";
      ctx.font = "12px Arial";
      ctx.fillText(`${point.value}°`, point.x - 10, point.y - 12);
      ctx.fillText(point.label, point.x - 22, canvas.height - 14);
    });
  },

  renderMeasurementsTable(exams) {
    const labels = exams.map((exam, index) => this.getExamLabel(index));

    const rows = [
      {
        label: "Cobb-Schätzung",
        values: exams.map((exam) => this.getMeasurement(exam.id, "estimatedCobbDeg", "°")),
      },
      {
        label: "Schulterdifferenz",
        values: exams.map((exam) => this.getMeasurement(exam.id, "shoulderDifferenceMm", " mm")),
      },
      {
        label: "Beckendifferenz",
        values: exams.map((exam) => this.getMeasurement(exam.id, "pelvisDifferenceMm", " mm")),
      },
      {
        label: "Kopfversatz",
        values: exams.map((exam) => this.getMeasurement(exam.id, "headOffsetMm", " mm")),
      },
    ];

    return `
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Messwert</th>
            ${labels.map((label) => `<th>${Utils.escapeHtml(label)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map((row) => `
              <tr>
                <td>${Utils.escapeHtml(row.label)}</td>
                ${row.values
                  .map((value, index) => {
                    const trend =
                      index === 0 && row.values.length > 1
                        ? this.getTrendMarkup(row.values[0].raw, row.values[1].raw)
                        : "";
                    return `<td>${Utils.escapeHtml(value.text)} ${trend}</td>`;
                  })
                  .join("")}
              </tr>
            `)
            .join("")}
        </tbody>
      </table>
    `;
  },

  renderThermalTable(exams) {
    const labels = exams.map((exam, index) => this.getExamLabel(index));

    const rows = [
      { label: "Status", values: exams.map((exam) => this.getThermalStatus(exam.id)) },
      { label: "Importiert", values: exams.map((exam) => this.getThermalCount(exam.id)) },
      { label: "Hinten", values: exams.map((exam) => this.getThermalViewCount(exam.id, "back")) },
      { label: "Links 45°", values: exams.map((exam) => this.getThermalViewCount(exam.id, "left45")) },
      { label: "Rechts 45°", values: exams.map((exam) => this.getThermalViewCount(exam.id, "right45")) },
    ];

    return `
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Wärmebild</th>
            ${labels.map((label) => `<th>${Utils.escapeHtml(label)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map((row) => `
              <tr>
                <td>${Utils.escapeHtml(row.label)}</td>
                ${row.values.map((value) => `<td>${Utils.escapeHtml(value)}</td>`).join("")}
              </tr>
            `)
            .join("")}
        </tbody>
      </table>
    `;
  },

  renderComparisonImages(exams) {
    return exams
      .map((exam, index) => {
        const label = this.getExamLabel(index);
        const imageSet = ImageStore.getByExamId(exam.id);
        const frontImage = imageSet?.views?.front?.[0] || null;

        if (!frontImage) {
          return `
            <div class="comparison-image-card">
              <div class="report-image-missing">Fehlt</div>
              <div class="comparison-image-meta">
                <div class="comparison-image-title">${Utils.escapeHtml(label)}</div>
              </div>
            </div>
          `;
        }

        return `
          <div class="comparison-image-card">
            <img src="${frontImage.filePreview}" alt="${Utils.escapeHtml(label)}" />
            <div class="comparison-image-meta">
              <div class="comparison-image-title">${Utils.escapeHtml(label)}</div>
            </div>
          </div>
        `;
      })
      .join("");
  },

  renderThermalGroupCompare(exams, viewKey, viewLabel) {
    return `
      <div class="comparison-layout">
        ${exams
          .map((exam, examIndex) => {
            const label = this.getExamLabel(examIndex);
            const thermalSet = ThermalStore.getByExamId(exam.id);
            const items = thermalSet?.views?.[viewKey] || [null, null, null];

            return `
              <div class="report-image-group">
                <h3>${Utils.escapeHtml(label)}</h3>
                <div class="report-image-grid">
                  ${items
                    .map((item, index) => {
                      const title = `${viewLabel} ${index + 1}`;

                      if (!item) {
                        return `
                          <div class="report-image-card">
                            <div class="report-image-missing">Fehlt</div>
                            <div class="report-image-label">${Utils.escapeHtml(title)}</div>
                          </div>
                        `;
                      }

                      return `
                        <div class="report-image-card">
                          <img src="${item.previewDataUrl}" alt="${Utils.escapeHtml(title)}" />
                          <div class="report-image-label">${Utils.escapeHtml(title)}</div>
                        </div>
                      `;
                    })
                    .join("")}
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  },

  getMeasurement(examId, key, suffix) {
    const analysis = AnalysisStore.findByExamId(examId);
    const raw = Utils.toNumber(analysis?.measurements?.[key], 0);
    return {
      raw,
      text: `${raw}${suffix}`,
    };
  },

  getThermalStatus(examId) {
    const analysis = AnalysisStore.findByExamId(examId);
    const status = analysis?.thermalDocumentation?.documentationStatus || "not-used";

    switch (status) {
      case "complete":
        return "Vollständig";
      case "partial":
        return "Teilweise";
      case "disabled":
        return "Deaktiviert";
      case "not-used":
      default:
        return "Nicht genutzt";
    }
  },

  getThermalCount(examId) {
    const analysis = AnalysisStore.findByExamId(examId);
    const count = Utils.toNumber(analysis?.thermalDocumentation?.importedCount, 0);
    return `${count} / 9`;
  },

  getThermalViewCount(examId, view) {
    const analysis = AnalysisStore.findByExamId(examId);
    const value = Utils.toNumber(analysis?.thermalDocumentation?.availableViews?.[view], 0);
    return `${value} / 3`;
  },

  getTrendMarkup(currentValue, previousValue) {
    if (currentValue > previousValue) return `<span class="trend-up">↑</span>`;
    if (currentValue < previousValue) return `<span class="trend-down">↓</span>`;
    return `<span class="trend-stable">→</span>`;
  },

  getExamLabel(index) {
    if (index === 0) return "Aktuell";
    if (index === 1) return "Vorher";
    return "Früher";
  },

  formatDate(dateString) {
    return Utils.safeDateOnly(dateString);
  },
};