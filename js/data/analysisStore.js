const AnalysisStore = {
  storageKey: "skoliose_analysis_v1",

  getAll() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("AnalysisStore.getAll parse error:", error);
      return [];
    }
  },

  saveAll(items) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  },

  findByExamId(examId) {
    return this.getAll().find((item) => item.examId === examId) || null;
  },

  save(analysis) {
    const all = this.getAll();
    const index = all.findIndex((item) => item.id === analysis.id);

    if (index >= 0) {
      all[index] = {
        ...analysis,
        updatedAt: new Date().toISOString(),
      };
    } else {
      all.push({
        ...analysis,
        updatedAt: new Date().toISOString(),
      });
    }

    this.saveAll(all);
    return analysis;
  },

  createEmpty(examId) {
    return {
      id: `analysis_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      examId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "completed",
      landmarks: {},
      axes: {},
      symmetry: {},
      measurements: {},
      qualityIndex: {},
      riskAssessment: {},
      spine3D: {},
      thermalDocumentation: {
        enabled: false,
        importedCount: 0,
        expectedCount: 9,
        completionPercent: 0,
        availableViews: {
          back: 0,
          left45: 0,
          right45: 0,
        },
        source: "",
        interpretationNote: "",
        documentationStatus: "not-used",
      },
      summary: {},
      recommendations: {},
    };
  },
};