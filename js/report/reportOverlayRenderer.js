const ReportOverlayRenderer = {
  async createOverlayDataUrl(imageSrc, view, slotKey, examId, maxWidth = 900) {
    const analysis = AnalysisStore.findByExamId(examId);
    if (!analysis) {
      return imageSrc;
    }

    const image = await this.loadImage(imageSrc);

    const ratio = image.width > 0 ? Math.min(1, maxWidth / image.width) : 1;
    const width = Math.max(1, Math.round(image.width * ratio));
    const height = Math.max(1, Math.round(image.height * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, width, height);

    const slotLandmarks = analysis.landmarks?.[view]?.[slotKey] || null;
    const aggregatedLandmarks = analysis.landmarks?.aggregated?.[view] || null;
    const landmarks = slotLandmarks || aggregatedLandmarks;

    if (!landmarks) {
      return canvas.toDataURL("image/jpeg", 0.92);
    }

    const toCanvasPoint = (point) => {
      if (!point || typeof point.x !== "number" || typeof point.y !== "number") {
        return null;
      }
      return {
        x: point.x * width,
        y: point.y * height,
      };
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
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const drawLine = (a, b) => {
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };

    const drawPoint = (point, radius = 5) => {
      if (!point) return;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

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

    Object.values(points).forEach((point) => drawPoint(point, 5));
    this.drawLabels(ctx, points, view);

    return canvas.toDataURL("image/jpeg", 0.92);
  },

  drawLabels(ctx, points, view) {
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "rgba(15,23,42,0.95)";
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 4;

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

    const labels = labelsByView[view] || [];
    labels.forEach(([key, label]) => {
      const point = points[key];
      if (!point) return;

      const x = point.x + 8;
      const y = point.y - 8;
      ctx.strokeText(label, x, y);
      ctx.fillText(label, x, y);
    });
  },

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Bild konnte nicht geladen werden."));
      image.src = src;
    });
  },
};