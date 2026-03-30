const Spine3DScreen = {
  title: "3D Wirbelsäule",
  animationFrameId: null,
  rotationAngle: 0,
  isRotating: true,

  render() {
    const exam = AppState.currentExam;
    if (!exam || !exam.analysisId) {
      return `
        <section class="screen spine3d-screen">
          <div class="card">
            <h2>3D Wirbelsäule</h2>
            <p>Kein Analyseergebnis verfügbar.</p>
            <div class="form-actions">
              <button id="btn-spine-back-summary" class="primary-button" type="button">
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
        <section class="screen spine3d-screen">
          <div class="card">
            <h2>3D Wirbelsäule</h2>
            <p>Analyse konnte nicht geladen werden.</p>
            <div class="form-actions">
              <button id="btn-spine-back-summary" class="primary-button" type="button">
                Zur Zusammenfassung
              </button>
            </div>
          </div>
        </section>
      `;
    }

    const spine = analysis.spine3D || {};
    const measurements = analysis.measurements || {};

    return `
      <section class="screen spine3d-screen">
        <div class="spine-grid">
          <div class="card spine-card">
            <h2>3D Wirbelsäule</h2>

            <div class="spine-stage">
              <canvas id="spine-canvas" width="600" height="760"></canvas>
            </div>
          </div>

          <div class="card spine-card">
            <h3>3D Information</h3>

            <div class="spine-row">
              <span>Cobb-Schätzung</span>
              <strong>${Utils.escapeHtml(String(measurements.estimatedCobbDeg ?? "-"))}°</strong>
            </div>

            <div class="spine-row">
              <span>Obere Endwirbelzone</span>
              <strong>${Utils.escapeHtml(String(spine.upperEndVertebraZone || "-"))}</strong>
            </div>

            <div class="spine-row">
              <span>Untere Endwirbelzone</span>
              <strong>${Utils.escapeHtml(String(spine.lowerEndVertebraZone || "-"))}</strong>
            </div>

            <p class="spine-text">
              Die Darstellung basiert auf den berechneten Oberflächendaten und visualisiert die geschätzte Krümmung technisch-modern.
            </p>
          </div>

          <div class="card spine-actions">
            <button id="btn-spine-rotate" class="primary-button" type="button">
              Rotation stoppen
            </button>

            <button id="btn-spine-reset" class="secondary-button" type="button">
              Ansicht zurücksetzen
            </button>

            <div class="spine-actions-grid">
              <button id="btn-spine-back-summary" class="secondary-button" type="button">
                Zusammenfassung
              </button>

              <button id="btn-spine-details" class="secondary-button" type="button">
                Details
              </button>
            </div>

            <button id="btn-spine-images" class="secondary-button" type="button">
              Bilder
            </button>
          </div>
        </div>
      </section>
    `;
  },

  bind() {
    document
      .getElementById("btn-spine-back-summary")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.SUMMARY);
      });

    document
      .getElementById("btn-spine-details")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.DETAILS);
      });

    document
      .getElementById("btn-spine-images")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.IMAGES);
      });

    document
      .getElementById("btn-spine-reset")
      ?.addEventListener("click", () => {
        this.rotationAngle = 0;
        this.draw();
      });

    document
      .getElementById("btn-spine-rotate")
      ?.addEventListener("click", (event) => {
        this.isRotating = !this.isRotating;
        event.currentTarget.textContent = this.isRotating
          ? "Rotation stoppen"
          : "Rotation starten";

        if (this.isRotating) {
          this.startAnimation();
        } else {
          this.stopAnimation();
        }
      });

    this.rotationAngle = 0;
    this.isRotating = true;
    this.draw();
    this.startAnimation();
  },

  beforeLeave() {
    this.stopAnimation();
  },

  startAnimation() {
    this.stopAnimation();

    const animate = () => {
      if (AppState.currentScreen !== Routes.SPINE3D) return;

      if (this.isRotating) {
        this.rotationAngle += 0.015;
        if (this.rotationAngle > Math.PI * 2) {
          this.rotationAngle = 0;
        }
        this.draw();
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  },

  stopAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  },

  draw() {
    const canvas = document.getElementById("spine-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const exam = AppState.currentExam;
    if (!exam) return;

    const analysis = AnalysisStore.findByExamId(exam.id);
    if (!analysis) return;

    const spine = analysis.spine3D || {};
    const curvePoints = Array.isArray(spine.curvePoints) ? spine.curvePoints : [];

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const topPadding = 70;
    const scaleY = 11;
    const scaleX = 34;
    const depthScale = 18;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i += 1) {
      const y = topPadding + i * 110;
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(canvas.width - 40, y);
      ctx.stroke();
    }

    const projectedPoints = curvePoints.map((point) => {
      const rotatedX =
        point.x * Math.cos(this.rotationAngle) - point.z * Math.sin(this.rotationAngle);
      const rotatedZ =
        point.x * Math.sin(this.rotationAngle) + point.z * Math.cos(this.rotationAngle);

      return {
        x: centerX + rotatedX * scaleX + rotatedZ * depthScale,
        y: topPadding + point.y * scaleY,
        depth: rotatedZ,
      };
    });

    if (projectedPoints.length > 1) {
      ctx.lineWidth = 6;
      ctx.lineCap = "round";

      for (let i = 0; i < projectedPoints.length - 1; i += 1) {
        const p1 = projectedPoints[i];
        const p2 = projectedPoints[i + 1];

        const ratio = i / Math.max(1, projectedPoints.length - 2);
        if (ratio < 0.33) {
          ctx.strokeStyle = "#3b82f6";
        } else if (ratio < 0.66) {
          ctx.strokeStyle = "#22c55e";
        } else {
          ctx.strokeStyle = "#f97316";
        }

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    projectedPoints.forEach((point, index) => {
      const ratio = index / Math.max(1, projectedPoints.length - 1);

      if (ratio < 0.33) {
        ctx.fillStyle = "#60a5fa";
      } else if (ratio < 0.66) {
        ctx.fillStyle = "#4ade80";
      } else {
        ctx.fillStyle = "#fb923c";
      }

      ctx.beginPath();
      ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
      ctx.fill();
    });

    if (projectedPoints.length >= 4) {
      const upper = projectedPoints[1];
      const lower = projectedPoints[projectedPoints.length - 2];

      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(upper.x - 70, upper.y - 10);
      ctx.lineTo(upper.x + 70, upper.y + 10);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(lower.x - 70, lower.y + 10);
      ctx.lineTo(lower.x + 70, lower.y - 10);
      ctx.stroke();
    }

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "bold 18px Arial";
    ctx.fillText("Technisch-modernes Wirbelsäulenmodell", 28, 34);
  },
};