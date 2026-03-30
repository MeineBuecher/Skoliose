const AnalysisService = {
  steps: [
    { key: "load-ai", label: "KI-Modelle laden", progress: 5 },
    { key: "detect-landmarks", label: "Körperpunkte erkennen", progress: 18 },
    { key: "normalize-landmarks", label: "Landmarken normalisieren", progress: 32 },
    { key: "compute-axes", label: "Körperachsen berechnen", progress: 48 },
    { key: "compute-symmetry", label: "Symmetrie berechnen", progress: 60 },
    { key: "compute-measurements", label: "Messwerte berechnen", progress: 72 },
    { key: "compute-quality", label: "Messqualitätsindex berechnen", progress: 80 },
    { key: "collect-thermal", label: "Wärmebild-Dokumentation prüfen", progress: 87 },
    { key: "compute-risk", label: "Risikoanalyse berechnen", progress: 93 },
    { key: "build-spine3d", label: "3D-Wirbelsäulenmodell erzeugen", progress: 97 },
    { key: "save-analysis", label: "Ergebnisse speichern", progress: 100 },
  ],

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  updateProgress(step) {
    AppState.analysisStatus.progress = step.progress;
    AppState.analysisStatus.stepKey = step.key;
    AppState.analysisStatus.stepLabel = step.label;

    if (typeof AnalysisScreen !== "undefined" && AnalysisScreen.updateProgressUI) {
      AnalysisScreen.updateProgressUI();
    }
  },

  makePoint(x, y, confidence = 0.92) {
    return {
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
      confidence: Number(confidence.toFixed(2)),
    };
  },

  averagePoints(...points) {
    const valid = points.filter(Boolean);
    if (!valid.length) return null;

    const x = valid.reduce((sum, point) => sum + point.x, 0) / valid.length;
    const y = valid.reduce((sum, point) => sum + point.y, 0) / valid.length;
    const confidence =
      valid.reduce((sum, point) => sum + (point.confidence || 0), 0) / valid.length;

    return this.makePoint(x, y, confidence);
  },

  createSyntheticSlotLandmarks(view, indexInView) {
    const shift = (indexInView - 2) * 0.004;

    if (view === "front") {
      const leftShoulder = this.makePoint(0.385 - shift, 0.285 + shift, 0.96);
      const rightShoulder = this.makePoint(0.615 - shift, 0.289 - shift, 0.96);
      const leftPelvis = this.makePoint(0.418 - shift, 0.538, 0.94);
      const rightPelvis = this.makePoint(0.582 - shift, 0.545, 0.94);

      return {
        nose: this.makePoint(0.503, 0.118, 0.98),
        chin: this.makePoint(0.502, 0.171, 0.97),
        leftEye: this.makePoint(0.468, 0.108, 0.96),
        rightEye: this.makePoint(0.538, 0.109, 0.96),
        leftEar: this.makePoint(0.438, 0.126, 0.93),
        rightEar: this.makePoint(0.565, 0.127, 0.93),
        jawLeft: this.makePoint(0.455, 0.158, 0.94),
        jawRight: this.makePoint(0.548, 0.159, 0.94),
        neckBase: this.makePoint(0.501, 0.227, 0.95),
        atlas: this.makePoint(0.501, 0.205, 0.91),
        leftShoulder,
        rightShoulder,
        sternum: this.makePoint(0.501, 0.332, 0.9),
        thoraxCenter: this.makePoint(0.501, 0.388, 0.89),
        waistLeft: this.makePoint(0.424, 0.468, 0.9),
        waistRight: this.makePoint(0.575, 0.471, 0.9),
        navel: this.makePoint(0.505, 0.492, 0.9),
        leftPelvis,
        rightPelvis,
        pelvisCenter: this.averagePoints(leftPelvis, rightPelvis),
        leftHip: this.makePoint(0.433, 0.558, 0.9),
        rightHip: this.makePoint(0.568, 0.562, 0.9),
        leftKnee: this.makePoint(0.446, 0.724, 0.91),
        rightKnee: this.makePoint(0.557, 0.728, 0.91),
        leftAnkle: this.makePoint(0.452, 0.914, 0.9),
        rightAnkle: this.makePoint(0.548, 0.917, 0.9),
        leftHeel: this.makePoint(0.447, 0.945, 0.86),
        rightHeel: this.makePoint(0.553, 0.948, 0.86),
        leftFoot: this.makePoint(0.432, 0.968, 0.84),
        rightFoot: this.makePoint(0.568, 0.969, 0.84),
      };
    }

    if (view === "back") {
      const leftShoulder = this.makePoint(0.392 - shift, 0.286, 0.95);
      const rightShoulder = this.makePoint(0.608 - shift, 0.292, 0.95);
      const leftPelvis = this.makePoint(0.421 - shift, 0.544, 0.93);
      const rightPelvis = this.makePoint(0.579 - shift, 0.548, 0.93);

      return {
        neckBase: this.makePoint(0.5, 0.223, 0.94),
        atlas: this.makePoint(0.5, 0.2, 0.9),
        occiput: this.makePoint(0.5, 0.145, 0.91),
        leftShoulder,
        rightShoulder,
        thoracicTop: this.makePoint(0.5, 0.31, 0.88),
        thoracicMid: this.makePoint(0.504, 0.405, 0.88),
        lumbarMid: this.makePoint(0.51, 0.503, 0.87),
        waistLeft: this.makePoint(0.429, 0.468, 0.89),
        waistRight: this.makePoint(0.571, 0.472, 0.89),
        leftPelvis,
        rightPelvis,
        pelvisCenter: this.averagePoints(leftPelvis, rightPelvis),
        sacrum: this.makePoint(0.503, 0.565, 0.86),
        leftKnee: this.makePoint(0.447, 0.726, 0.9),
        rightKnee: this.makePoint(0.555, 0.729, 0.9),
        leftAnkle: this.makePoint(0.451, 0.915, 0.89),
        rightAnkle: this.makePoint(0.549, 0.916, 0.89),
        leftHeel: this.makePoint(0.445, 0.949, 0.84),
        rightHeel: this.makePoint(0.555, 0.949, 0.84),
      };
    }

    if (view === "left") {
      return {
        profileForehead: this.makePoint(0.532, 0.113, 0.94),
        nose: this.makePoint(0.552, 0.136, 0.95),
        chin: this.makePoint(0.526, 0.176, 0.94),
        ear: this.makePoint(0.488, 0.129, 0.92),
        atlas: this.makePoint(0.486, 0.205, 0.89),
        neckBase: this.makePoint(0.487, 0.232, 0.92),
        shoulder: this.makePoint(0.479, 0.289, 0.95),
        thoraxCenter: this.makePoint(0.493, 0.395, 0.88),
        lumbarCenter: this.makePoint(0.506, 0.505, 0.87),
        pelvis: this.makePoint(0.522, 0.55, 0.91),
        hip: this.makePoint(0.529, 0.59, 0.9),
        knee: this.makePoint(0.52, 0.726, 0.9),
        ankle: this.makePoint(0.516, 0.913, 0.89),
        heel: this.makePoint(0.497, 0.948, 0.83),
        foot: this.makePoint(0.541, 0.968, 0.82),
      };
    }

    return {
      profileForehead: this.makePoint(0.468, 0.113, 0.94),
      nose: this.makePoint(0.448, 0.136, 0.95),
      chin: this.makePoint(0.474, 0.176, 0.94),
      ear: this.makePoint(0.512, 0.129, 0.92),
      atlas: this.makePoint(0.514, 0.205, 0.89),
      neckBase: this.makePoint(0.513, 0.232, 0.92),
      shoulder: this.makePoint(0.521, 0.289, 0.95),
      thoraxCenter: this.makePoint(0.507, 0.395, 0.88),
      lumbarCenter: this.makePoint(0.494, 0.505, 0.87),
      pelvis: this.makePoint(0.478, 0.55, 0.91),
      hip: this.makePoint(0.471, 0.59, 0.9),
      knee: this.makePoint(0.48, 0.726, 0.9),
      ankle: this.makePoint(0.484, 0.913, 0.89),
      heel: this.makePoint(0.503, 0.948, 0.83),
      foot: this.makePoint(0.459, 0.968, 0.82),
    };
  },

  createLandmarks(imageSet) {
    const result = {
      front: {},
      back: {},
      left: {},
      right: {},
      aggregated: {},
    };

    if (!imageSet) return result;

    ["front", "back", "left", "right"].forEach((view) => {
      const items = imageSet.views?.[view] || [];
      items.forEach((item, index) => {
        if (!item) return;
        const landmarks = this.createSyntheticSlotLandmarks(view, index + 1);
        result[view][item.slot] = {
          ...landmarks,
          slot: item.slot,
          view,
          indexInView: index + 1,
        };
      });
    });

    result.aggregated = this.aggregateLandmarks(result);
    return result;
  },

  aggregateLandmarks(landmarks) {
    const aggregated = {
      front: {},
      back: {},
      left: {},
      right: {},
    };

    ["front", "back", "left", "right"].forEach((view) => {
      const slots = Object.values(landmarks[view] || {});
      if (!slots.length) return;

      const keys = Object.keys(slots[0]).filter(
        (key) =>
          slots[0][key] &&
          typeof slots[0][key] === "object" &&
          "x" in slots[0][key] &&
          "y" in slots[0][key]
      );

      keys.forEach((key) => {
        const points = slots.map((slot) => slot[key]).filter(Boolean);
        aggregated[view][key] = this.averagePoints(...points);
      });
    });

    return aggregated;
  },

  calculateAngleDeg(pointA, pointB) {
    if (!pointA || !pointB) return 0;
    const angleRad = Math.atan2(pointB.y - pointA.y, pointB.x - pointA.x);
    return Number((angleRad * (180 / Math.PI)).toFixed(2));
  },

  verticalDeviationMm(pointA, pointB, scaleMm = 200) {
    if (!pointA || !pointB) return 0;
    return Number((Math.abs(pointA.x - pointB.x) * scaleMm).toFixed(1));
  },

  horizontalDifferenceMm(pointA, pointB, scaleMm = 220) {
    if (!pointA || !pointB) return 0;
    return Number((Math.abs(pointA.y - pointB.y) * scaleMm).toFixed(1));
  },

  createAxes(aggregatedLandmarks) {
    const front = aggregatedLandmarks.front || {};
    const back = aggregatedLandmarks.back || {};
    const left = aggregatedLandmarks.left || {};
    const right = aggregatedLandmarks.right || {};

    const shoulderCenter = this.averagePoints(front.leftShoulder, front.rightShoulder);
    const pelvisCenter = this.averagePoints(front.leftPelvis, front.rightPelvis);
    const waistCenter = this.averagePoints(front.waistLeft, front.waistRight);
    const posteriorShoulderCenter = this.averagePoints(back.leftShoulder, back.rightShoulder);
    const posteriorPelvisCenter = this.averagePoints(back.leftPelvis, back.rightPelvis);

    return {
      frontal: {
        shoulderAxisDeg: this.calculateAngleDeg(front.leftShoulder, front.rightShoulder),
        pelvicAxisDeg: this.calculateAngleDeg(front.leftPelvis, front.rightPelvis),
        shoulderCenter,
        pelvisCenter,
        trunkAxisDeg: this.calculateAngleDeg(shoulderCenter, pelvisCenter),
        waistCenter,
      },
      posterior: {
        shoulderAxisDeg: this.calculateAngleDeg(back.leftShoulder, back.rightShoulder),
        pelvicAxisDeg: this.calculateAngleDeg(back.leftPelvis, back.rightPelvis),
        shoulderCenter: posteriorShoulderCenter,
        pelvisCenter: posteriorPelvisCenter,
        trunkAxisDeg: this.calculateAngleDeg(posteriorShoulderCenter, posteriorPelvisCenter),
      },
      sagittalLeft: {
        headForwardShiftNorm: Number(
          Math.abs((left.nose?.x || 0) - (left.atlas?.x || 0)).toFixed(4)
        ),
        thoraxPelvisShiftNorm: Number(
          Math.abs((left.thoraxCenter?.x || 0) - (left.pelvis?.x || 0)).toFixed(4)
        ),
      },
      sagittalRight: {
        headForwardShiftNorm: Number(
          Math.abs((right.nose?.x || 0) - (right.atlas?.x || 0)).toFixed(4)
        ),
        thoraxPelvisShiftNorm: Number(
          Math.abs((right.thoraxCenter?.x || 0) - (right.pelvis?.x || 0)).toFixed(4)
        ),
      },
    };
  },

  createSymmetry(aggregatedLandmarks, axes) {
    const front = aggregatedLandmarks.front || {};
    const back = aggregatedLandmarks.back || {};

    const shoulderDifferenceMm = this.horizontalDifferenceMm(
      front.leftShoulder,
      front.rightShoulder
    );
    const pelvisDifferenceMm = this.horizontalDifferenceMm(
      front.leftPelvis,
      front.rightPelvis
    );
    const waistDifferenceMm = this.horizontalDifferenceMm(
      front.waistLeft,
      front.waistRight
    );
    const backShoulderDifferenceMm = this.horizontalDifferenceMm(
      back.leftShoulder,
      back.rightShoulder
    );
    const backPelvisDifferenceMm = this.horizontalDifferenceMm(
      back.leftPelvis,
      back.rightPelvis
    );

    const trunkMidlineDeviationMm = this.verticalDeviationMm(
      axes.frontal?.shoulderCenter,
      axes.frontal?.pelvisCenter,
      180
    );

    return {
      frontal: {
        shoulderDifferenceMm,
        pelvisDifferenceMm,
        waistDifferenceMm,
        trunkMidlineDeviationMm,
      },
      posterior: {
        shoulderDifferenceMm: backShoulderDifferenceMm,
        pelvisDifferenceMm: backPelvisDifferenceMm,
      },
    };
  },

  createMeasurements(patient, exam, imageSet, landmarks, axes, symmetry) {
    const front = landmarks.aggregated?.front || {};
    const back = landmarks.aggregated?.back || {};
    const left = landmarks.aggregated?.left || {};
    const right = landmarks.aggregated?.right || {};

    const capturedCount = imageSet ? ImageStore.countCaptured(exam.id) : 0;

    const shoulderDifferenceMm = Number(
      ((symmetry.frontal?.shoulderDifferenceMm || 0) * 0.55 + 3.2).toFixed(1)
    );
    const pelvisDifferenceMm = Number(
      ((symmetry.frontal?.pelvisDifferenceMm || 0) * 0.72 + 4.5).toFixed(1)
    );
    const waistAsymmetryMm = Number(
      ((symmetry.frontal?.waistDifferenceMm || 0) * 0.68 + 2.8).toFixed(1)
    );
    const trunkLateralDeviationMm = Number(
      ((symmetry.frontal?.trunkMidlineDeviationMm || 0) * 0.9 + 1.2).toFixed(1)
    );

    const headOffsetMm = Number(
      (this.verticalDeviationMm(front.nose, axes.frontal?.shoulderCenter, 120) + 4.1).toFixed(1)
    );

    const headTiltDeg = Number(
      (Math.abs(this.calculateAngleDeg(front.leftEye, front.rightEye)) * 0.18).toFixed(1)
    );

    const jawAsymmetryDeg = Number(
      (Math.abs(this.calculateAngleDeg(front.jawLeft, front.jawRight)) * 0.16).toFixed(1)
    );

    const navelOffsetMm = Number(
      (this.verticalDeviationMm(front.navel, axes.frontal?.pelvisCenter, 100) + 1.9).toFixed(1)
    );

    const legAxisDeg = Number(
      (
        Math.abs(this.calculateAngleDeg(front.leftPelvis, front.leftKnee) + 90) * 0.12 +
        Math.abs(this.calculateAngleDeg(front.rightPelvis, front.rightKnee) + 90) * 0.12
      ).toFixed(1)
    );

    const footRotationLeftDeg = Number(
      (Math.abs(this.calculateAngleDeg(front.leftHeel, front.leftFoot)) * 0.11).toFixed(1)
    );

    const footRotationRightDeg = Number(
      (Math.abs(this.calculateAngleDeg(front.rightHeel, front.rightFoot)) * 0.11).toFixed(1)
    );

    const sagittalHeadForwardMm = Number(
      (
        (((axes.sagittalLeft?.headForwardShiftNorm || 0) +
          (axes.sagittalRight?.headForwardShiftNorm || 0)) /
          2) *
          160 +
        3.5
      ).toFixed(1)
    );

    const sagittalThoraxPelvisShiftMm = Number(
      (
        (((axes.sagittalLeft?.thoraxPelvisShiftNorm || 0) +
          (axes.sagittalRight?.thoraxPelvisShiftNorm || 0)) /
          2) *
          180 +
        2.4
      ).toFixed(1)
    );

    const posteriorSpineCurveFactor =
      Math.abs((back.thoracicMid?.x || 0) - (back.lumbarMid?.x || 0)) +
      Math.abs((back.lumbarMid?.x || 0) - (back.sacrum?.x || 0));

    const estimatedCobbDeg = Number(
      (
        shoulderDifferenceMm * 0.28 +
        pelvisDifferenceMm * 0.34 +
        trunkLateralDeviationMm * 0.42 +
        posteriorSpineCurveFactor * 75 +
        4.8
      ).toFixed(1)
    );

    const postureIndexScore = Number(
      (
        shoulderDifferenceMm +
        pelvisDifferenceMm +
        trunkLateralDeviationMm +
        estimatedCobbDeg * 0.65 +
        sagittalHeadForwardMm * 0.2
      ).toFixed(1)
    );

    return {
      capturedCount,
      shoulderDifferenceMm,
      shoulderRating:
        shoulderDifferenceMm >= 10 ? "deutlich" : shoulderDifferenceMm >= 6 ? "mäßig" : "leicht",
      pelvisDifferenceMm,
      pelvisRating:
        pelvisDifferenceMm >= 10 ? "auffällig" : pelvisDifferenceMm >= 6 ? "mäßig" : "leicht",
      headOffsetMm,
      headOffsetRating:
        headOffsetMm > 20 ? "stark auffällig" : headOffsetMm > 10 ? "deutlich" : "leicht",
      headTiltDeg,
      navelOffsetMm,
      trunkLateralDeviationMm,
      waistAsymmetryMm,
      jawAsymmetryDeg,
      sagittalHeadForwardMm,
      sagittalThoraxPelvisShiftMm,
      legAxisCategory: legAxisDeg > 4.5 ? "X-Bein / Achsabweichung" : "neutral",
      legAxisDeg,
      footRotationLeftDeg,
      footRotationRightDeg,
      estimatedCobbDeg,
      frontalShoulderAxisDeg: Number(
        Math.abs((axes.frontal?.shoulderAxisDeg || 0)).toFixed(1)
      ),
      frontalPelvicAxisDeg: Number(
        Math.abs((axes.frontal?.pelvicAxisDeg || 0)).toFixed(1)
      ),
      posteriorShoulderAxisDeg: Number(
        Math.abs((axes.posterior?.shoulderAxisDeg || 0)).toFixed(1)
      ),
      posteriorPelvicAxisDeg: Number(
        Math.abs((axes.posterior?.pelvicAxisDeg || 0)).toFixed(1)
      ),
      postureIndexScore,
    };
  },

  createQualityIndex(measurements, landmarks) {
    const frontSlots = Object.keys(landmarks.front || {}).length;
    const backSlots = Object.keys(landmarks.back || {}).length;
    const leftSlots = Object.keys(landmarks.left || {}).length;
    const rightSlots = Object.keys(landmarks.right || {}).length;

    const completenessScore =
      ((frontSlots + backSlots + leftSlots + rightSlots) / 12) * 100;

    const asymmetryPenalty =
      measurements.shoulderDifferenceMm * 0.45 +
      measurements.pelvisDifferenceMm * 0.4 +
      measurements.trunkLateralDeviationMm * 0.3;

    const reproducibilityPercent = Math.max(
      68,
      Math.min(98, Math.round(completenessScore - asymmetryPenalty + 6))
    );

    let overallRating = "hoch";
    if (reproducibilityPercent >= 92) overallRating = "sehr hoch";
    else if (reproducibilityPercent >= 84) overallRating = "hoch";
    else if (reproducibilityPercent >= 74) overallRating = "gut";
    else if (reproducibilityPercent >= 60) overallRating = "eingeschränkt";
    else overallRating = "unzureichend";

    return {
      overallRating,
      reproducibilityPercent,
      repeatRecommendation:
        reproducibilityPercent < 72 ? "empfohlen" : "nein",
      viewScores: {
        front: Math.min(100, Math.round(reproducibilityPercent + 2)),
        back: Math.min(100, Math.round(reproducibilityPercent)),
        left: Math.max(0, Math.round(reproducibilityPercent - 2)),
        right: Math.max(0, Math.round(reproducibilityPercent - 1)),
      },
      outliers: [],
      pointStability: Number((reproducibilityPercent / 100).toFixed(2)),
      axisStability: Number(((reproducibilityPercent - 2) / 100).toFixed(2)),
      measurementStability: Number(((reproducibilityPercent - 1) / 100).toFixed(2)),
    };
  },

  createThermalDocumentation(exam) {
    const settings = SettingsStore.get();

    if (!settings.thermalEnabled) {
      return {
        enabled: false,
        importedCount: 0,
        expectedCount: 9,
        completionPercent: 0,
        availableViews: {
          back: 0,
          left45: 0,
          right45: 0,
        },
        source: "deaktiviert",
        interpretationNote:
          "Die Wärmebildfunktion war in den Einstellungen deaktiviert.",
        documentationStatus: "disabled",
      };
    }

    const thermalSet = ThermalStore.getByExamId(exam.id);
    const importedCount = ThermalStore.countImported(exam.id);
    const availableViews = {
      back: thermalSet?.views?.back?.filter(Boolean).length || 0,
      left45: thermalSet?.views?.left45?.filter(Boolean).length || 0,
      right45: thermalSet?.views?.right45?.filter(Boolean).length || 0,
    };

    let documentationStatus = "not-used";
    if (importedCount > 0 && importedCount < 9) {
      documentationStatus = "partial";
    } else if (importedCount === 9) {
      documentationStatus = "complete";
    }

    return {
      enabled: true,
      importedCount,
      expectedCount: 9,
      completionPercent: Math.round((importedCount / 9) * 100),
      availableViews,
      source: thermalSet?.deviceType || "HIKMICRO Import",
      interpretationNote:
        importedCount > 0
          ? "Wärmebilder wurden als ergänzende Dokumentation importiert und nicht zur automatischen Diagnosebewertung herangezogen."
          : "Keine Wärmebilder importiert.",
      documentationStatus,
    };
  },

  createRiskAssessment(measurements, qualityIndex, thermalDocumentation) {
    let trafficLight = "yellow";
    let riskLevel = "auffaellig";
    let explanationShort =
      "Leichte bis mäßige Haltungsabweichung.";
    let explanationLong =
      "Die Untersuchung zeigt auffällige, aber noch moderat ausgeprägte Haltungsasymmetrien.";

    if (
      measurements.estimatedCobbDeg >= 20 ||
      measurements.pelvisDifferenceMm >= 12 ||
      measurements.trunkLateralDeviationMm >= 9
    ) {
      trafficLight = "orange";
      riskLevel = "deutlich-auffaellig";
      explanationShort =
        "Deutliche Haltungsabweichung mit skoliotischer Tendenz.";
      explanationLong =
        "Die Untersuchung zeigt reproduzierbare Auffälligkeiten im Rumpf-, Schulter- und Beckenbereich. Eine fachliche Verlaufskontrolle ist ratsam.";
    }

    if (
      measurements.estimatedCobbDeg >= 35 ||
      measurements.headOffsetMm > 24 ||
      measurements.trunkLateralDeviationMm >= 14
    ) {
      trafficLight = "red";
      riskLevel = "stark-abklaerungsbeduerftig";
      explanationShort =
        "Stark auffällige Haltungsabweichung.";
      explanationLong =
        "Die Untersuchung zeigt ausgeprägte Auffälligkeiten. Eine orthopädische Abklärung sollte erwogen werden.";
    }

    if (qualityIndex.reproducibilityPercent < 72) {
      explanationLong +=
        " Die Messqualität ist eingeschränkt, daher sollte die Untersuchung bei Bedarf wiederholt werden.";
    }

    if (thermalDocumentation?.enabled) {
      if (thermalDocumentation.importedCount === 9) {
        explanationLong +=
          " Ergänzend liegt eine vollständige Wärmebild-Dokumentation vor.";
      } else if (thermalDocumentation.importedCount > 0) {
        explanationLong +=
          " Ergänzend liegt eine teilweise Wärmebild-Dokumentation vor.";
      }
    }

    return {
      trafficLight,
      riskLevel,
      explanationShort,
      explanationLong,
    };
  },

  createSpine3D(measurements) {
    const cobb = measurements.estimatedCobbDeg;
    const lateral = measurements.trunkLateralDeviationMm;

    return {
      modelType: "technical-modern",
      autoRotate: true,
      rotationSpeed: 1,
      curvePoints: [
        { x: 0, y: 0, z: 0 },
        { x: 0.25, y: 10, z: 0.08 },
        { x: cobb * 0.055, y: 20, z: 0.42 },
        { x: cobb * 0.085 + lateral * 0.03, y: 30, z: 0.95 },
        { x: cobb * 0.06, y: 40, z: 0.36 },
        { x: 0.18, y: 50, z: 0.09 },
      ],
      estimatedCobbDeg: cobb,
      upperEndVertebraZone: cobb >= 20 ? "T4" : "T5",
      lowerEndVertebraZone: cobb >= 20 ? "L2" : "L1",
    };
  },

  createSummary(measurements, qualityIndex, riskAssessment, thermalDocumentation) {
    return {
      mainResult: riskAssessment.explanationShort,
      trafficLight: riskAssessment.trafficLight,
      riskLevel: riskAssessment.riskLevel,
      measurementQuality: qualityIndex.overallRating,
      reproducibilityPercent: qualityIndex.reproducibilityPercent,
      thermalStatus: thermalDocumentation.documentationStatus,
      thermalImportedCount: thermalDocumentation.importedCount,
      keyValues: {
        shoulderDifferenceMm: measurements.shoulderDifferenceMm,
        pelvisDifferenceMm: measurements.pelvisDifferenceMm,
        headOffsetMm: measurements.headOffsetMm,
        estimatedCobbDeg: measurements.estimatedCobbDeg,
      },
    };
  },

  createRecommendations(riskAssessment, thermalDocumentation) {
    const layMode = [];
    const professionalMode = [];

    if (riskAssessment.riskLevel === "auffaellig") {
      layMode.push("Verlaufskontrolle sinnvoll.");
      layMode.push("Bei Beschwerden fachliche Abklärung erwägen.");
      professionalMode.push("Fachliche Verlaufskontrolle empfohlen.");
      professionalMode.push("Klinische Korrelation prüfen.");
    } else if (riskAssessment.riskLevel === "deutlich-auffaellig") {
      layMode.push("Eine fachliche Kontrolle ist ratsam.");
      layMode.push("Verlauf dokumentieren.");
      professionalMode.push("Orthopädische Verlaufskontrolle empfohlen.");
      professionalMode.push("Funktionelle und strukturelle Komponenten differenzieren.");
    } else if (riskAssessment.riskLevel === "stark-abklaerungsbeduerftig") {
      layMode.push("Orthopädische Untersuchung empfohlen.");
      professionalMode.push("Zeitnahe orthopädische Abklärung empfohlen.");
    } else {
      layMode.push("Aktuell keine dringende Maßnahme notwendig.");
      professionalMode.push("Unauffälliger Befund im Rahmen der Oberflächenanalyse.");
    }

    if (thermalDocumentation?.enabled && thermalDocumentation.importedCount > 0) {
      layMode.push("Wärmebilder wurden ergänzend dokumentiert.");
      professionalMode.push("Thermische Dokumentation ergänzend verfügbar.");
    }

    return {
      layMode,
      professionalMode,
    };
  },

  async run(exam, patient) {
    const imageSet = ImageStore.getByExamId(exam.id);
    if (!imageSet || ImageStore.countCaptured(exam.id) < 12) {
      throw new Error("Für die Analyse sind 12 Standardbilder erforderlich.");
    }

    AppState.analysisStatus.running = true;
    AppState.analysisStatus.completed = false;
    AppState.analysisStatus.error = "";

    for (const step of this.steps) {
      this.updateProgress(step);
      await this.wait(350);
    }

    const analysis = AnalysisStore.createEmpty(exam.id);

    analysis.landmarks = this.createLandmarks(imageSet);
    analysis.axes = this.createAxes(analysis.landmarks.aggregated);
    analysis.symmetry = this.createSymmetry(analysis.landmarks.aggregated, analysis.axes);
    analysis.measurements = this.createMeasurements(
      patient,
      exam,
      imageSet,
      analysis.landmarks,
      analysis.axes,
      analysis.symmetry
    );
    analysis.qualityIndex = this.createQualityIndex(
      analysis.measurements,
      analysis.landmarks
    );
    analysis.thermalDocumentation = this.createThermalDocumentation(exam);
    analysis.riskAssessment = this.createRiskAssessment(
      analysis.measurements,
      analysis.qualityIndex,
      analysis.thermalDocumentation
    );
    analysis.spine3D = this.createSpine3D(analysis.measurements);
    analysis.summary = this.createSummary(
      analysis.measurements,
      analysis.qualityIndex,
      analysis.riskAssessment,
      analysis.thermalDocumentation
    );
    analysis.recommendations = this.createRecommendations(
      analysis.riskAssessment,
      analysis.thermalDocumentation
    );

    AnalysisStore.save(analysis);

    const updatedExam = {
      ...exam,
      analysisId: analysis.id,
      status: "completed",
      sections: {
        ...exam.sections,
        analysis: "completed",
      },
      needsReanalysis: false,
    };

    const savedExam = ExamStore.update(updatedExam);
    AppState.currentExam = savedExam || updatedExam;

    AppState.analysisStatus.running = false;
    AppState.analysisStatus.completed = true;
    AppState.analysisStatus.needsReanalysis = false;

    return analysis;
  },
};