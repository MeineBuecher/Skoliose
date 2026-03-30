const ReportStore = {
  storageKey: "skoliose_reports_v1",

  getAll() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("ReportStore.getAll parse error:", error);
      return [];
    }
  },

  saveAll(items) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  },

  findByExamId(examId) {
    return this.getAll().find((item) => item.examId === examId) || null;
  },

  save(report) {
    const all = this.getAll();
    const index = all.findIndex((item) => item.id === report.id);

    if (index >= 0) {
      all[index] = {
        ...report,
        updatedAt: new Date().toISOString(),
      };
    } else {
      all.push({
        ...report,
        updatedAt: new Date().toISOString(),
      });
    }

    this.saveAll(all);
    return report;
  },

  create(examId, mode, htmlContent) {
    return {
      id: `report_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      examId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mode,
      filePdf: null,
      htmlContent,
      includedSections: {
        patientData: true,
        standardImages: true,
        thermalImages: false,
        measurements: true,
        qualityIndex: true,
        spine3D: true,
        comparison: false,
      },
    };
  },
};