const CaptureScreen = {
  title: "Standardbilder aufnehmen",
  animationFrameId: null,
  currentAmpelResult: null,

  render() {
    const exam = AppState.currentExam;
    const patient = AppState.currentPatient;

    if (!exam || !patient) {
      return Utils.makeErrorCard(
        "Standardbilder aufnehmen",
        "Keine aktive Untersuchung vorhanden.",
        "btn-capture-back-home",
        "Zur Startseite"
      );
    }

    const slotIndex = Utils.clamp(
      Utils.toNumber(AppState.captureStatus?.currentSlotIndex, 0),
      0,
      Math.max(0, CaptureSequence.length - 1)
    );

    const slotInfo = CaptureSequence[slotIndex];
    if (!slotInfo) {
      return Utils.makeErrorCard(
        "Standardbilder aufnehmen",
        "Aufnahmeslot konnte nicht geladen werden.",
        "btn-capture-back-review",
        "Zur Prüfseite"
      );
    }

    const currentImage = ImageStore.getSlot(exam.id, slotInfo.view, slotInfo.indexInView);
    const totalCaptured = ImageStore.countCaptured(exam.id);

    const poseStats = this.getPoseStats(slotInfo.view, exam.id);
    const allDone = totalCaptured >= CaptureSequence.length;
    const nextButtonLabel = allDone ? "Auswertung" : "Weiter";

    return `
      <section class="screen capture-screen camera-capture-screen">
        <div class="camera-stage-full">
          <video id="capture-video" playsinline muted autoplay></video>
          <canvas id="capture-overlay-canvas"></canvas>

          <div id="capture-overlay">
            <div id="camera-crosshair" aria-hidden="true"></div>
          </div>

          <div class="camera-top-info">
            <div class="camera-top-pill camera-pose-pill">
              ${Utils.escapeHtml(slotInfo.label || slotInfo.view || "Pose")}
            </div>
            <div class="camera-top-pill camera-counter-pill">
              ${Utils.escapeHtml(String(poseStats.capturedInPose))}/${Utils.escapeHtml(String(poseStats.totalInPose))}
            </div>
          </div>

          ${
            currentImage
              ? `
          <div class="camera-preview-thumb">
            <img src="${currentImage.filePreview}" alt="Letzte Aufnahme" />
          </div>
          `
              : ""
          }

          <div class="camera-bottom-controls">
            <button id="btn-capture-pose-select" class="camera-side-btn" type="button">
              Pose
            </button>

            <button
              id="btn-capture-photo"
              class="camera-shutter-btn"
              type="button"
              aria-label="Foto aufnehmen"
            >
              <span class="camera-shutter-inner"></span>
            </button>

            <button id="btn-capture-next-slot" class="camera-side-btn" type="button">
              ${nextButtonLabel}
            </button>
          </div>

          <div class="camera-secondary-controls">
            <button id="btn-capture-back-review" class="camera-text-btn" type="button">
              Prüfseite
            </button>

            <button id="btn-capture-retake-slot" class="camera-text-btn" type="button">
              Wiederholen
            </button>
          </div>
        </div>
      </section>
    `;
  },

  async bind() {
    document.body.classList.add("capture-mode");

    document
      .getElementById("btn-capture-back-home")
      ?.addEventListener("click", () => {
        document.body.classList.remove("capture-mode");
        Router.goTo(Routes.HOME);
      });

    document
      .getElementById("btn-capture-back-review")
      ?.addEventListener("click", () => {
        document.body.classList.remove("capture-mode");
        Router.goTo(Routes.REVIEW);
      });

    document
      .getElementById("btn-capture-pose-select")
      ?.addEventListener("click", () => {
        this.openPoseSelection();
      });

    document
      .getElementById("btn-capture-next-slot")
      ?.addEventListener("click", () => {
        const totalCaptured = ImageStore.countCaptured(AppState.currentExam?.id);
        if (totalCaptured >= CaptureSequence.length) {
          document.body.classList.remove("capture-mode");
          Router.goTo(Routes.REVIEW);
          return;
        }
        this.goToNextSlotOrReview();
      });

    document
      .getElementById("btn-capture-retake-slot")
      ?.addEventListener("click", () => {
        AppState.captureStatus.currentSlotIndex = Utils.clamp(
          Utils.toNumber(AppState.captureStatus.currentSlotIndex, 0),
          0,
          Math.max(0, CaptureSequence.length - 1)
        );
        Router.reload();
      });

    document
      .getElementById("btn-capture-photo")
      ?.addEventListener("click", async () => {
        try {
          await this.captureCurrentSlot();
        } catch (error) {
          console.error(error);
          alert(error.message || "Foto konnte nicht aufgenommen werden.");
        }
      });

    await this.startCamera();
  },

  async beforeLeave() {
    document.body.classList.remove("capture-mode");
    this.stopLoop();
    AmpelSystem.reset();
    await CameraController.stop();
  },

  async startCamera() {
    const exam = AppState.currentExam;
    const video = document.getElementById("capture-video");

    if (!exam || !video) return;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Dieser Browser unterstützt keine Kamera.");
      }

      await CameraController.start(video, exam.cameraDeviceId || "environment-camera");

      AppState.captureStatus.streamActive = true;

      this.startLoop();
    } catch (error) {
      console.error("startCamera error:", error);

      AppState.captureStatus.streamActive = false;
    }
  },

  startLoop() {
    this.stopLoop();

    const loop = () => {
      if (AppState.currentScreen !== Routes.CAPTURE) return;

      const video = document.getElementById("capture-video");
      const canvas = document.getElementById("capture-overlay-canvas");
      const photoButton = document.getElementById("btn-capture-photo");

      if (!video || !canvas || !photoButton) return;

      const stage = canvas.parentElement?.getBoundingClientRect();
      if (stage) {
        canvas.width = Math.max(1, Math.floor(stage.width));
        canvas.height = Math.max(1, Math.floor(stage.height));
      }

      const slotInfo = this.getCurrentSlotInfo();
      this.currentAmpelResult = AmpelSystem.evaluate(video);

      OverlayRenderer.draw(
        canvas,
        slotInfo,
        this.currentAmpelResult,
        ImageStore.countCaptured(AppState.currentExam?.id)
      );

      photoButton.disabled = false;

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  },

  stopLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  },

  async captureCurrentSlot() {
    const exam = AppState.currentExam;
    const video = document.getElementById("capture-video");

    if (!exam || !video || !CameraController.isReady()) {
      throw new Error("Kamera ist nicht bereit.");
    }

    const slotInfo = this.getCurrentSlotInfo();
    if (!slotInfo) {
      throw new Error("Aufnahmeslot fehlt.");
    }

    const originalDataUrl = this.captureFrameFromVideo(video, 960);
    const previewDataUrl = await this.createPreviewDataUrl(originalDataUrl, 320);

    const image = await this.loadImage(originalDataUrl);

    const slotData = {
      slot: slotInfo.slot,
      view: slotInfo.view,
      indexInView: slotInfo.indexInView,
      fileOriginal: originalDataUrl,
      filePreview: previewDataUrl,
      width: Utils.toNumber(image.width, 0),
      height: Utils.toNumber(image.height, 0),
      capturedAt: new Date().toISOString(),
    };

    const savedSet = ImageStore.saveSlot(exam.id, slotData);
    if (!savedSet) {
      throw new Error("Foto konnte nicht gespeichert werden.");
    }

    const capturedCount = ImageStore.countCaptured(exam.id);

    const updatedExam = {
      ...exam,
      imageSetId: savedSet.id,
      sections: {
        ...exam.sections,
        standardImages: capturedCount >= 12 ? "completed" : "in-progress",
      },
    };

    const savedExam = ExamStore.update(updatedExam);
    AppState.currentExam = savedExam || updatedExam;
    AppState.captureStatus.totalCaptured = capturedCount;

    const nextIndex = Utils.toNumber(AppState.captureStatus.currentSlotIndex, 0) + 1;
    if (nextIndex >= CaptureSequence.length) {
      document.body.classList.remove("capture-mode");
      Router.goTo(Routes.REVIEW);
      return;
    }

    AppState.captureStatus.currentSlotIndex = nextIndex;
    Router.reload();
  },

  captureFrameFromVideo(video, targetHeight = 960) {
    const sourceWidth = Utils.toNumber(video.videoWidth, 0);
    const sourceHeight = Utils.toNumber(video.videoHeight, 0);

    if (sourceWidth <= 0 || sourceHeight <= 0) {
      throw new Error("Videobild ist nicht verfügbar.");
    }

    const ratio = targetHeight / sourceHeight;
    const width = Math.max(1, Math.round(sourceWidth * ratio));
    const height = Math.max(1, Math.round(sourceHeight * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Aufnahme-Canvas konnte nicht erstellt werden.");
    }

    ctx.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.82);
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
          reject(new Error("Vorschaubild konnte nicht erstellt werden."));
          return;
        }

        ctx.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };

      image.onerror = () => reject(new Error("Vorschaubild konnte nicht geladen werden."));
      image.src = dataUrl;
    });
  },

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Bild konnte nicht gelesen werden."));
      image.src = src;
    });
  },

  getCurrentSlotInfo() {
    const slotIndex = Utils.clamp(
      Utils.toNumber(AppState.captureStatus?.currentSlotIndex, 0),
      0,
      Math.max(0, CaptureSequence.length - 1)
    );
    return CaptureSequence[slotIndex] || null;
  },

  getPoseStats(view, examId) {
    const slotsInPose = CaptureSequence.filter((slot) => slot.view === view);
    const totalInPose = slotsInPose.length;

    let capturedInPose = 0;
    for (const slot of slotsInPose) {
      const stored = ImageStore.getSlot(examId, slot.view, slot.indexInView);
      if (stored) capturedInPose += 1;
    }

    return {
      totalInPose,
      capturedInPose,
    };
  },

  openPoseSelection() {
    const currentSlot = this.getCurrentSlotInfo();
    const views = [...new Set(CaptureSequence.map((slot) => slot.view))];

    const lines = views.map((view, index) => {
      const marker = currentSlot?.view === view ? "●" : "○";
      return `${index + 1}: ${marker} ${view}`;
    });

    const input = window.prompt(
      `Pose auswählen:\n\n${lines.join("\n")}\n\nBitte Nummer eingeben:`,
      "1"
    );

    if (!input) return;

    const selectedIndex = Number(input) - 1;
    if (Number.isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= views.length) {
      alert("Ungültige Auswahl.");
      return;
    }

    const selectedView = views[selectedIndex];
    const firstSlotIndex = CaptureSequence.findIndex((slot) => slot.view === selectedView);

    if (firstSlotIndex === -1) {
      alert("Pose konnte nicht geöffnet werden.");
      return;
    }

    AppState.captureStatus.currentSlotIndex = firstSlotIndex;
    Router.reload();
  },

  goToNextSlotOrReview() {
    const currentIndex = Utils.toNumber(AppState.captureStatus.currentSlotIndex, 0);
    const nextIndex = currentIndex + 1;

    if (nextIndex >= CaptureSequence.length) {
      document.body.classList.remove("capture-mode");
      Router.goTo(Routes.REVIEW);
      return;
    }

    AppState.captureStatus.currentSlotIndex = nextIndex;
    Router.reload();
  },

  getAmpelClass(color) {
    if (color === "green") return "status-green";
    if (color === "yellow") return "status-yellow";
    return "status-red";
  },
};