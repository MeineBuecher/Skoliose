const CameraCapture = {
  createPreviewDataUrl(sourceCanvas, targetWidth = 320) {
    const scale = targetWidth / sourceCanvas.width;
    const targetHeight = Math.round(sourceCanvas.height * scale);

    const previewCanvas = document.createElement("canvas");
    previewCanvas.width = targetWidth;
    previewCanvas.height = targetHeight;

    const ctx = previewCanvas.getContext("2d");
    ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

    return previewCanvas.toDataURL("image/jpeg", 0.8);
  },

  capture(videoElement) {
    if (!videoElement || !videoElement.videoWidth || !videoElement.videoHeight) {
      throw new Error("Kamerabild nicht verfügbar.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    const originalDataUrl = canvas.toDataURL("image/jpeg", 0.95);
    const previewDataUrl = this.createPreviewDataUrl(canvas, 320);

    return {
      originalDataUrl,
      previewDataUrl,
      width: canvas.width,
      height: canvas.height,
      orientation: canvas.height >= canvas.width ? "portrait" : "landscape",
    };
  },
};