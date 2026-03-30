const ExamStore = {
  storageKey: StorageKeys.EXAMS,

  getAll() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("ExamStore.getAll parse error:", error);
      return [];
    }
  },

  saveAll(exams) {
    localStorage.setItem(this.storageKey, JSON.stringify(exams));
  },

  add(exam) {
    const exams = this.getAll();
    exams.push(exam);
    this.saveAll(exams);
    return exam;
  },

  update(updatedExam) {
    const exams = this.getAll();
    const index = exams.findIndex((exam) => exam.id === updatedExam.id);
    if (index === -1) return null;

    exams[index] = {
      ...updatedExam,
      updatedAt: new Date().toISOString(),
    };

    this.saveAll(exams);
    return exams[index];
  },

  findById(examId) {
    return this.getAll().find((exam) => exam.id === examId) || null;
  },

  getByPatientId(patientId) {
    return this.getAll()
      .filter((exam) => exam.patientId === patientId)
      .sort((a, b) => {
        if (a.sequencePerPatient === b.sequencePerPatient) {
          return a.createdAt < b.createdAt ? 1 : -1;
        }
        return b.sequencePerPatient - a.sequencePerPatient;
      });
  },

  getNextSequenceForPatient(patientId) {
    const exams = this.getByPatientId(patientId);
    if (exams.length === 0) return 1;

    const maxSequence = exams.reduce((max, exam) => {
      const current = Number(exam.sequencePerPatient || 0);
      return current > max ? current : max;
    }, 0);

    return maxSequence + 1;
  },

  createExamNumber(patientNumber, sequencePerPatient) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const datePart = `${year}${month}${day}`;
    const seqPart = String(sequencePerPatient).padStart(3, "0");

    return `SKO-${datePart}-${patientNumber}-${seqPart}`;
  },

  createDraftExam(patient, reportMode, camera) {
    const sequencePerPatient = this.getNextSequenceForPatient(patient.id);
    const examNumber = this.createExamNumber(
      patient.patientNumber,
      sequencePerPatient
    );

    return {
      id: `exam_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      examNumber,
      patientId: patient.id,
      patientNumber: patient.patientNumber,
      sequencePerPatient,
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reportMode,
      status: "draft",
      camera: camera || {
        deviceId: "default-camera",
        label: "Standardkamera",
      },
      sections: {
        patientData: "completed",
        standardImages: "empty",
        thermalImages: "optional",
        review: "empty",
        analysis: "empty",
        report: "empty",
      },
      standardImageSetId: null,
      thermalImageSetId: null,
      analysisId: null,
      reportId: null,
      comparisonIds: [],
      needsReanalysis: false,
      changeLog: [],
    };
  },
};