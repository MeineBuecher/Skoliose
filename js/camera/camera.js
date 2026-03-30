const CameraController = {
  stream: null,
  videoElement: null,
  currentFacingMode: "environment",
  lastError: "",

  async start(videoElement, preferredCamera = "environment-camera") {
    this.videoElement = videoElement;
    this.lastError = "";

    if (!videoElement) {
      throw new Error("Videoelement fehlt.");
    }

    await this.stop();

    const facingMode =
      preferredCamera === "user-camera" ? "user" : "environment";

    this.currentFacingMode = facingMode;

    const constraintSets = [
      {
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        }
      },
      {
        audio: false,
        video: {
          facingMode: facingMode
        }
      },
      {
        audio: false,
        video: true
      }
    ];

    let stream = null;
    let lastError = null;

    for (const constraints of constraintSets) {
      try {
        stream = await this.getUserMediaWithTimeout(constraints, 8000);
        if (stream) break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!stream) {
      this.lastError = this.mapError(lastError);
      throw new Error(this.lastError);
    }

    this.stream = stream;

    videoElement.setAttribute("playsinline", "true");
    videoElement.setAttribute("autoplay", "true");
    videoElement.setAttribute("muted", "true");
    videoElement.muted = true;
    videoElement.autoplay = true;
    videoElement.srcObject = stream;

    try {
      await this.playVideoWithTimeout(videoElement, 5000);
    } catch (error) {
      this.lastError = "Kamerabild konnte nicht gestartet werden.";
      throw new Error(this.lastError);
    }

    await this.waitUntilReady(videoElement, 6000);
    return true;
  },

  async stop() {
    if (this.videoElement) {
      try {
        this.videoElement.pause();
      } catch (error) {
        console.error(error);
      }
      this.videoElement.srcObject = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (error) {
          console.error(error);
        }
      });
    }

    this.stream = null;
    return true;
  },

  isReady() {
    return Boolean(
      this.videoElement &&
      this.videoElement.readyState >= 2 &&
      this.videoElement.videoWidth > 0 &&
      this.videoElement.videoHeight > 0
    );
  },

  getVideoSize() {
    if (!this.videoElement) {
      return { width: 0, height: 0 };
    }

    return {
      width: Utils.toNumber(this.videoElement.videoWidth, 0),
      height: Utils.toNumber(this.videoElement.videoHeight, 0)
    };
  },

  async getUserMediaWithTimeout(constraints, timeoutMs = 8000) {
    return await Promise.race([
      navigator.mediaDevices.getUserMedia(constraints),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("camera-timeout")), timeoutMs)
      )
    ]);
  },

  async playVideoWithTimeout(videoElement, timeoutMs = 5000) {
    return await Promise.race([
      videoElement.play(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("video-play-timeout")), timeoutMs)
      )
    ]);
  },

  waitUntilReady(videoElement, timeoutMs = 6000) {
    return new Promise((resolve, reject) => {
      const startedAt = Date.now();

      const check = () => {
        if (
          videoElement.readyState >= 2 &&
          videoElement.videoWidth > 0 &&
          videoElement.videoHeight > 0
        ) {
          resolve(true);
          return;
        }

        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error("video-not-ready-timeout"));
          return;
        }

        requestAnimationFrame(check);
      };

      check();
    });
  },

  mapError(error) {
    const name = error?.name || "";
    const message = error?.message || "";

    if (name === "NotAllowedError") {
      return "Kamerazugriff wurde nicht erlaubt.";
    }

    if (name === "NotFoundError") {
      return "Keine Kamera gefunden.";
    }

    if (name === "NotReadableError") {
      return "Kamera ist bereits in Benutzung.";
    }

    if (name === "OverconstrainedError") {
      return "Gewählte Kameraeinstellung ist nicht verfügbar.";
    }

    if (message === "camera-timeout") {
      return "Kamera reagiert nicht. Bitte Browser neu laden.";
    }

    if (message === "video-play-timeout" || message === "video-not-ready-timeout") {
      return "Kamerabild startet nicht. Bitte Berechtigung prüfen.";
    }

    return "Kamera konnte nicht gestartet werden.";
  }
};
