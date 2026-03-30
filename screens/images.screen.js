const ImagesScreen = {
  title: "Bilder",
  currentImageData: null,
  currentOverlayVisible: false,

  render() {
    const exam = AppState.currentExam;
    const settings = SettingsStore.get();

    if (!exam) {
      return Utils.makeErrorCard(
        "Bilder",
        "Keine Untersuchung aktiv.",
        "btn-images-back-home",
        "Zur Startseite"
      );
    }

    const imageSet = ImageStore.getByExamId(exam.id);
    const thermalSet = settings.thermalEnabled ? ThermalStore.getByExamId(exam.id) : null;

    if (!imageSet) {
      return Utils.makeErrorCard(
        "Bilder",
        "Keine Standardbilder verfügbar.",
        "btn-images-back-summary",
        "Zur Zusammenfassung"
      );
    }

    return `
      <section class="screen images-screen">
        <div class="images-layout">
          ${this.renderGroup("front", "Vorne", imageSet)}
          ${this.renderGroup("back", "Hinten", imageSet)}
          ${this.renderGroup("left", "Links", imageSet)}
          ${this.renderGroup("right", "Rechts", imageSet)}

          <div class="card images-panel">
            <h3>Bildansicht</h3>

            <div id="images-viewer-wrapper" class="images-viewer">
              <div class="images-thermal-placeholder">
                Bitte ein Bild auswählen.
              </div>
            </div>
          </div>

          ${
            settings.thermalEnabled
              ? `
          <div class="card images-panel">
            <h3>Wärmebilder</h3>
            ${this.renderThermalOverview(thermalSet)}
          </div>
          `
              : `
          <div class="card images-panel">
            <h3>Wärmebilder</h3>
            <div class="images-thermal-placeholder">
              Wärmebildfunktion ist deaktiviert.
            </div>
          </div>
          `
          }

          <div class="card images-actions">
            <div class="images-actions-grid">
              <button id="btn-images-summary" class="secondary-button" type="button">
                Zusammenfassung
              </button>

              <button id="btn-images-details" class="secondary-button" type="button">
                Details
              </button>
            </div>

            <div class="images-actions-grid">
              <button id="btn-images-spine" class="secondary-button" type="button">
                3D Wirbelsäule
              </button>

              <button id="btn-images-report" class="primary-button" type="button">
                PDF Bericht
              </button>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  renderGroup(view, label, imageSet) {
    const items = imageSet?.views?.[view] || [null, null, null];

    return `
      <div class="card images-panel">
        <h3>${Utils.escapeHtml(label)}</h3>

        <div class="images-grid">
          ${items
            .map((item, index) => {
              const slotNumber = index + 1;
              const title = `${label} ${slotNumber}`;

              if (!item) {
                return `
                  <div class="images-card">
                    <div class="empty-state">Fehlt</div>
                    <div class="images-meta">
                      <div class="images-title">${Utils.escapeHtml(title)}</div>
                    </div>
                  </div>
                `;
              }

              return `
                <div class="images-card">
                  <img src="${item.filePreview}" alt="${Utils.escapeHtml(title)}" />

                  <div class="images-meta">
                    <div class="images-title">${Utils.escapeHtml(title)}</div>

                    <button
                      class="small-button btn-image-open"
                      type="button"
                      data-view="${Utils.escapeHtml(view)}"
                      data-index="${slotNumber}"
                    >
                      Vergrößern
                    </button>

                    <button
                      class="small-button btn-image-overlay"
                      type="button"
                      data-view="${Utils.escapeHtml(view)}"
                      data-index="${slotNumber}"
                    >
                      Messpunkte
                    </button>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  },

  renderThermalOverview(thermalSet) {
    if (!thermalSet || ThermalStore.countImported(thermalSet.examId) === 0) {
      return `<div class="images-thermal-placeholder">Keine Wärmebilder eingefügt</div>`;
    }

    const groups = [
      { key: "back", label: "Hinten" },
      { key: "left45", label: "Links 45°" },
      { key: "right45", label: "Rechts 45°" },
    ];

    return groups
      .map((group) => {
        const items = thermalSet.views[group.key] || [];
        return `
          <div class="report-image-group">
            <h3>${Utils.escapeHtml(group.label)}</h3>
            <div class="report-image-grid">
              ${items
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
                .join("")}
            </div>
          </div>
        `;
      })
      .join("");
  },

  bind() {
    document
      .getElementById("btn-images-back-home")
      ?.addEventListener("click", () => Router.goTo(Routes.HOME));

    document
      .getElementById("btn-images-back-summary")
      ?.addEventListener("click", () => Router.goTo(Routes.SUMMARY));

    document
      .getElementById("btn-images-summary")
      ?.addEventListener("click", () => Router.goTo(Routes.SUMMARY));

    document
      .getElementById("btn-images-details")
      ?.addEventListener("click", () => Router.goTo(Routes.DETAILS));

    document
      .getElementById("btn-images-spine")
      ?.addEventListener("click", () => Router.goTo(Routes.SPINE3D));

    document
      .getElementById("btn-images-report")
      ?.addEventListener("click", () => Router.goTo(Routes.REPORT));

    document.querySelectorAll(".btn-image-open").forEach((button) => {
      button.addEventListener("click", () => {
        const view = button.getAttribute("data-view");
        const index = Number(button.getAttribute("data-index"));
        this.openImage(view, index, false);
      });
    });

    document.querySelectorAll(".btn-image-overlay").forEach((button) => {
      button.addEventListener("click", () => {
        const view = button.getAttribute("data-view");
        const index = Number(button.getAttribute("data-index"));
        this.openImage(view, index, true);
      });
    });
  },

  openImage(view, indexInView, showOverlay) {
    const exam = AppState.currentExam;
    if (!exam) return;

    const slotData = ImageStore.getSlot(exam.id, view, indexInView);
    if (!slotData) {
      alert("Bild ist nicht verfügbar.");
      return;
    }

    this.currentImageData = { view, indexInView, slotData };
    this.currentOverlayVisible = showOverlay;

    const wrapper = document.getElementById("images-viewer-wrapper");
    if (!wrapper) return;

    const title = `${this.getViewLabel(view)} ${indexInView}`;

    wrapper.innerHTML = `
      <div class="images-viewer-stage">
        <img id="images-viewer-image" src="${slotData.fileOriginal}" alt="${Utils.escapeHtml(title)}" />
        <canvas id="images-overlay-canvas"></canvas>
      </div>

      <div class="images-viewer-meta">
        <div class="info-line">
          <span>Pose</span>
          <strong>${Utils.escapeHtml(title)}</strong>
        </div>

        <div class="info-line">
          <span>Zeit</span>
          <strong>${Utils.safeDateString(slotData.capturedAt)}</strong>
        </div>

        <div class="info-line">
          <span>Auflösung</span>
          <strong>${Utils.toNumber(slotData.width, 0)} × ${Utils.toNumber(slotData.height, 0)}</strong>
        </div>

        <div class="form-actions">
          <button id="btn-images-toggle-overlay" class="secondary-button" type="button">
            ${showOverlay ? "Messpunkte ausblenden" : "Messpunkte einblenden"}
          </button>
        </div>
      </div>
    `;

    document
      .getElementById("btn-images-toggle-overlay")
      ?.addEventListener("click", () => {
        this.currentOverlayVisible = !this.currentOverlayVisible;
        this.openImage(view, indexInView, this.currentOverlayVisible);
      });

    const image = document.getElementById("images-viewer-image");
    image?.addEventListener("load", () => this.drawOverlay());
    image?.addEventListener("error", () => {
      wrapper.innerHTML = `<div class="images-thermal-placeholder">Bild konnte nicht geladen werden.</div>`;
    });

    if (image?.complete) {
      this.drawOverlay();
    }
  },

  drawOverlay() {
    const canvas = document.getElementById("images-overlay-canvas");
    const image = document.getElementById("images-viewer-image");
    const exam = AppState.currentExam;

    if (!canvas || !image || !exam) return;

    const rect = image.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!this.currentOverlayVisible || !this.currentImageData) {
      return;
    }

    const analysis = AnalysisStore.findByExamId(exam.id);
    if (!analysis) {
      this.drawFallbackOverlay(ctx, canvas);
      return;
    }

    const view = this.currentImageData.view;
    const slotKey = this.currentImageData.slotData.slot;
    const slotLandmarks = analysis.landmarks?.[view]?.[slotKey] || null;
    const aggregatedLandmarks = analysis.landmarks?.aggregated?.[view] || null;
    const landmarks = slotLandmarks || aggregatedLandmarks;

    if (!landmarks) {
      this.drawFallbackOverlay(ctx, canvas);
      return;
    }

    const toCanvasPoint = (point) => {
      if (!point || typeof point.x !== "number" || typeof point.y !== "number") {
        return null;
      }
      return {
        x: point.x * canvas.width,
        y: point.y * canvas.height,
      };
    };

    const drawPoint = (point, radius = 4) => {
      if (!point) return;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawLine = (a, b) => {
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };

    const points = {};
    Object.entries(landmarks).forEach(([key, value]) => {
      if (
        value &&
        typeof value === "object" &&
        typeof value.x === "number" &&
        typeof value.y === "number"
      ) {
        points[key] = toCanvasPoint(value);
      }
    });

    ctx.strokeStyle = "rgba(59,130,246,0.96)";
    ctx.fillStyle = "rgba(59,130,246,0.96)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (view === "front") {
      drawLine(points.leftEye, points.rightEye);
      drawLine(points.leftEar, points.rightEar);
      drawLine(points.jawLeft, points.jawRight);
      drawLine(points.leftShoulder, points.rightShoulder);
      drawLine(points.leftPelvis, points.rightPelvis);
      drawLine(points.waistLeft, points.waistRight);
      drawLine(points.leftHip, points.rightHip);
      drawLine(points.leftShoulder, points.leftPelvis);
      drawLine(points.rightShoulder, points.rightPelvis);
      drawLine(points.neckBase, points.sternum);
      drawLine(points.sternum, points.thoraxCenter);
      drawLine(points.thoraxCenter, points.navel);
      drawLine(points.navel, points.pelvisCenter);
      drawLine(points.leftPelvis, points.leftKnee);
      drawLine(points.leftKnee, points.leftAnkle);
      drawLine(points.rightPelvis, points.rightKnee);
      drawLine(points.rightKnee, points.rightAnkle);
      drawLine(points.leftHeel, points.leftFoot);
      drawLine(points.rightHeel, points.rightFoot);
    } else if (view === "back") {
      drawLine(points.leftShoulder, points.rightShoulder);
      drawLine(points.leftPelvis, points.rightPelvis);
      drawLine(points.waistLeft, points.waistRight);
      drawLine(points.atlas, points.neckBase);
      drawLine(points.neckBase, points.thoracicTop);
      drawLine(points.thoracicTop, points.thoracicMid);
      drawLine(points.thoracicMid, points.lumbarMid);
      drawLine(points.lumbarMid, points.sacrum);
      drawLine(points.leftPelvis, points.leftKnee);
      drawLine(points.leftKnee, points.leftAnkle);
      drawLine(points.rightPelvis, points.rightKnee);
      drawLine(points.rightKnee, points.rightAnkle);
      drawLine(points.leftHeel, points.rightHeel);
    } else if (view === "left" || view === "right") {
      drawLine(points.profileForehead, points.nose);
      drawLine(points.nose, points.chin);
      drawLine(points.ear, points.atlas);
      drawLine(points.atlas, points.neckBase);
      drawLine(points.neckBase, points.shoulder);
      drawLine(points.shoulder, points.thoraxCenter);
      drawLine(points.thoraxCenter, points.lumbarCenter);
      drawLine(points.lumbarCenter, points.pelvis);
      drawLine(points.pelvis, points.hip);
      drawLine(points.hip, points.knee);
      drawLine(points.knee, points.ankle);
      drawLine(points.heel, points.foot);
    }

    Object.values(points).forEach((point) => drawPoint(point, 4));
    this.drawLabels(ctx, points, view);
  },

  drawLabels(ctx, points, view) {
    ctx.font = "11px Arial";
    ctx.fillStyle = "rgba(15,23,42,0.92)";
    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    ctx.lineWidth = 3;

    const labelsByView = {
      front: [
        ["nose", "N"],
        ["atlas", "A"],
        ["leftShoulder", "S"],
        ["rightShoulder", "S"],
        ["navel", "B"],
        ["leftPelvis", "P"],
        ["rightPelvis", "P"],
        ["leftKnee", "K"],
        ["rightKnee", "K"],
      ],
      back: [
        ["atlas", "A"],
        ["thoracicTop", "T"],
        ["thoracicMid", "T"],
        ["lumbarMid", "L"],
        ["sacrum", "S"],
        ["leftPelvis", "P"],
        ["rightPelvis", "P"],
      ],
      left: [
        ["nose", "N"],
        ["atlas", "A"],
        ["shoulder", "S"],
        ["pelvis", "P"],
        ["knee", "K"],
        ["ankle", "A"],
      ],
      right: [
        ["nose", "N"],
        ["atlas", "A"],
        ["shoulder", "S"],
        ["pelvis", "P"],
        ["knee", "K"],
        ["ankle", "A"],
      ],
    };

    (labelsByView[view] || []).forEach(([key, label]) => {
      const point = points[key];
      if (!point) return;

      const x = point.x + 7;
      const y = point.y - 7;
      ctx.strokeText(label, x, y);
      ctx.fillText(label, x, y);
    });
  },

  drawFallbackOverlay(ctx, canvas) {
    ctx.strokeStyle = "rgba(59,130,246,0.95)";
    ctx.fillStyle = "rgba(59,130,246,0.95)";
    ctx.lineWidth = 2;

    const centerX = canvas.width / 2;
    const shoulderY = canvas.height * 0.3;
    const pelvisY = canvas.height * 0.55;
    const leftX = canvas.width * 0.35;
    const rightX = canvas.width * 0.65;

    ctx.beginPath();
    ctx.moveTo(leftX, shoulderY);
    ctx.lineTo(rightX, shoulderY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(leftX, pelvisY);
    ctx.lineTo(rightX, pelvisY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX, canvas.height * 0.15);
    ctx.lineTo(centerX, canvas.height * 0.82);
    ctx.stroke();

    [
      { x: leftX, y: shoulderY },
      { x: rightX, y: shoulderY },
      { x: leftX, y: pelvisY },
      { x: rightX, y: pelvisY },
      { x: centerX, y: canvas.height * 0.17 },
    ].forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  },

  getViewLabel(view) {
    switch (view) {
      case "front":
        return "Vorne";
      case "back":
        return "Hinten";
      case "left":
        return "Links";
      case "right":
        return "Rechts";
      default:
        return view;
    }
  },
};