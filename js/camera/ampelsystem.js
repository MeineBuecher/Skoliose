const AmpelSystem = {
  readySince: 0,
  lastState: "red",

  reset() {
    this.readySince = 0;
    this.lastState = "red";
  },

  evaluate(videoElement) {
    if (!videoElement) {
      this.lastState = "red";
      this.readySince = 0;
      return {
        color: "red",
        label: "Kamera fehlt",
        canCapture: false,
        message: "Videoelement nicht verfügbar.",
      };
    }

    const width = Utils.toNumber(videoElement.videoWidth, 0);
    const height = Utils.toNumber(videoElement.videoHeight, 0);

    if (width <= 0 || height <= 0 || videoElement.readyState < 2) {
      this.lastState = "red";
      this.readySince = 0;
      return {
        color: "red",
        label: "Kamera startet",
        canCapture: false,
        message: "Bitte kurz warten.",
      };
    }

    const isPortraitFriendly = height >= width * 1.15;

    if (!isPortraitFriendly) {
      this.lastState = "red";
      this.readySince = 0;
      return {
        color: "red",
        label: "Bitte hochkant",
        canCapture: false,
        message: "Die Kamera sollte im Hochformat verwendet werden.",
      };
    }

    if (!this.readySince) {
      this.readySince = Date.now();
    }

    const stableMs = Date.now() - this.readySince;

    if (stableMs < 700) {
      this.lastState = "red";
      return {
        color: "red",
        label: "Ausrichten",
        canCapture: false,
        message: "Bitte Körper mittig und vollständig im Rahmen halten.",
      };
    }

    if (stableMs < 1500) {
      this.lastState = "yellow";
      return {
        color: "yellow",
        label: "Fast bereit",
        canCapture: true,
        message: "Aufnahme ist möglich, Position noch leicht prüfen.",
      };
    }

    this.lastState = "green";
    return {
      color: "green",
      label: "Bereit",
      canCapture: true,
      message: "Aufnahme kann gemacht werden.",
    };
  },
};