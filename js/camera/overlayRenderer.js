const OverlayRenderer = {
  draw(canvas, slotInfo, ampelResult, capturedCount) {
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    this.drawCrosshair(ctx, width, height);
    this.drawBodyFrame(ctx, width, height);
    this.drawGuideAxes(ctx, width, height);
    this.drawPseudoPoints(ctx, width, height, slotInfo?.view || "front");
    this.drawHeader(ctx, width, height, slotInfo, ampelResult, capturedCount);
    this.drawFooter(ctx, width, height, ampelResult);
  },

  drawCrosshair(ctx, width, height) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.restore();
  },

  drawBodyFrame(ctx, width, height) {
    const frame = {
      x: width * 0.24,
      y: height * 0.12,
      w: width * 0.52,
      h: height * 0.68,
      radius: 22,
    };

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 2;
    this.roundRect(ctx, frame.x, frame.y, frame.w, frame.h, frame.radius);
    ctx.stroke();
    ctx.restore();
  },

  drawGuideAxes(ctx, width, height) {
    ctx.save();
    ctx.strokeStyle = "rgba(59,130,246,0.92)";
    ctx.fillStyle = "rgba(59,130,246,0.92)";
    ctx.lineWidth = 2;

    const frame = {
      x: width * 0.24,
      y: height * 0.12,
      w: width * 0.52,
      h: height * 0.68,
    };

    const centerX = frame.x + frame.w / 2;
    const shoulderY = frame.y + frame.h * 0.22;
    const sternumY = frame.y + frame.h * 0.34;
    const pelvisY = frame.y + frame.h * 0.52;
    const leftX = frame.x + frame.w * 0.32;
    const rightX = frame.x + frame.w * 0.68;

    ctx.beginPath();
    ctx.moveTo(leftX, shoulderY);
    ctx.lineTo(rightX, shoulderY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX, frame.y + frame.h * 0.06);
    ctx.lineTo(centerX, frame.y + frame.h * 0.94);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(leftX + 10, pelvisY);
    ctx.lineTo(rightX - 10, pelvisY);
    ctx.stroke();

    [
      { x: leftX, y: shoulderY },
      { x: rightX, y: shoulderY },
      { x: centerX, y: sternumY },
      { x: leftX + 12, y: pelvisY },
      { x: rightX - 12, y: pelvisY },
    ].forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  },

  drawPseudoPoints(ctx, width, height, view) {
    ctx.save();
    ctx.strokeStyle = "rgba(59,130,246,0.92)";
    ctx.fillStyle = "rgba(59,130,246,0.92)";
    ctx.lineWidth = 2;

    const normalizedView = String(view || "")
      .trim()
      .toLowerCase();

    const isFrontOrBack =
      normalizedView === "front" ||
      normalizedView === "back" ||
      normalizedView === "vorne" ||
      normalizedView === "hinten";

    const frame = {
      x: width * 0.24,
      y: height * 0.12,
      w: width * 0.52,
      h: height * 0.68,
    };

    if (isFrontOrBack) {
      const points = {
        head: { x: frame.x + frame.w * 0.50, y: frame.y + frame.h * 0.08 },
        leftShoulder: { x: frame.x + frame.w * 0.33, y: frame.y + frame.h * 0.22 },
        rightShoulder: { x: frame.x + frame.w * 0.67, y: frame.y + frame.h * 0.22 },
        leftPelvis: { x: frame.x + frame.w * 0.38, y: frame.y + frame.h * 0.52 },
        rightPelvis: { x: frame.x + frame.w * 0.62, y: frame.y + frame.h * 0.52 },
        leftKnee: { x: frame.x + frame.w * 0.44, y: frame.y + frame.h * 0.78 },
        rightKnee: { x: frame.x + frame.w * 0.56, y: frame.y + frame.h * 0.78 },
        leftAnkle: { x: frame.x + frame.w * 0.46, y: frame.y + frame.h * 0.95 },
        rightAnkle: { x: frame.x + frame.w * 0.54, y: frame.y + frame.h * 0.95 },
      };

      this.drawLine(ctx, points.leftShoulder, points.rightShoulder);
      this.drawLine(ctx, points.leftPelvis, points.rightPelvis);
      this.drawLine(ctx, points.head, {
        x: (points.leftPelvis.x + points.rightPelvis.x) / 2,
        y: (points.leftPelvis.y + points.rightPelvis.y) / 2,
      });
      this.drawLine(ctx, points.leftPelvis, points.leftKnee);
      this.drawLine(ctx, points.leftKnee, points.leftAnkle);
      this.drawLine(ctx, points.rightPelvis, points.rightKnee);
      this.drawLine(ctx, points.rightKnee, points.rightAnkle);

      Object.values(points).forEach((point) => this.drawPoint(ctx, point, 4));
    } else {
      const points = {
        head: { x: frame.x + frame.w * 0.54, y: frame.y + frame.h * 0.08 },
        atlas: { x: frame.x + frame.w * 0.49, y: frame.y + frame.h * 0.15 },
        shoulder: { x: frame.x + frame.w * 0.49, y: frame.y + frame.h * 0.24 },
        pelvis: { x: frame.x + frame.w * 0.52, y: frame.y + frame.h * 0.53 },
        knee: { x: frame.x + frame.w * 0.52, y: frame.y + frame.h * 0.79 },
        ankle: { x: frame.x + frame.w * 0.51, y: frame.y + frame.h * 0.95 },
      };

      this.drawLine(ctx, points.head, points.atlas);
      this.drawLine(ctx, points.atlas, points.shoulder);
      this.drawLine(ctx, points.shoulder, points.pelvis);
      this.drawLine(ctx, points.pelvis, points.knee);
      this.drawLine(ctx, points.knee, points.ankle);

      Object.values(points).forEach((point) => this.drawPoint(ctx, point, 4));
    }

    ctx.restore();
  },

  drawHeader(ctx, width, height, slotInfo, ampelResult, capturedCount) {
    ctx.save();

    ctx.fillStyle = "rgba(15,23,42,0.68)";
    this.roundRect(ctx, 12, 12, width - 24, 52, 14);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px Arial";
    ctx.fillText(
      `${slotInfo?.label || "Pose"} ${Utils.toNumber(slotInfo?.indexInView, 0)}`,
      24,
      33
    );

    ctx.font = "13px Arial";
    ctx.fillText(`Bild ${Utils.toNumber(slotInfo?.totalIndex, 0)} / 12`, 24, 52);

    const statusText = `${Utils.toNumber(capturedCount, 0)} gespeichert`;
    const textWidth = ctx.measureText(statusText).width;
    ctx.fillText(statusText, width - textWidth - 24, 43);

    if (ampelResult) {
      const pillWidth = 96;
      const pillX = width - pillWidth - 14;
      const pillY = 76;

      let color = "#dc2626";
      if (ampelResult.color === "yellow") color = "#d97706";
      if (ampelResult.color === "green") color = "#16a34a";

      ctx.fillStyle = color;
      this.roundRect(ctx, pillX, pillY, pillWidth, 30, 999);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px Arial";
      const labelWidth = ctx.measureText(ampelResult.label || "").width;
      ctx.fillText(
        ampelResult.label || "",
        pillX + (pillWidth - labelWidth) / 2,
        pillY + 20
      );
    }

    ctx.restore();
  },

  drawFooter(ctx, width, height, ampelResult) {
    ctx.save();

    ctx.fillStyle = "rgba(15,23,42,0.62)";
    this.roundRect(ctx, 14, height - 58, width - 28, 42, 12);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "13px Arial";
    ctx.fillText(
      ampelResult?.message || "Bitte Körper mittig im Rahmen halten.",
      24,
      height - 31
    );

    ctx.restore();
  },

  drawLine(ctx, a, b) {
    if (!a || !b) return;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  },

  drawPoint(ctx, point, radius = 4) {
    if (!point) return;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
  },

  roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  },
};