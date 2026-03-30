const PatientStore = {
  getAll() {
    const raw = localStorage.getItem(StorageKeys.PATIENTS);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("PatientStore.getAll parse error:", error);
      return [];
    }
  },

  saveAll(patients) {
    localStorage.setItem(StorageKeys.PATIENTS, JSON.stringify(patients));
  },

  getNextPatientNumber() {
    const patients = this.getAll();
    const maxNumber = patients.reduce((max, patient) => {
      const current = Number(patient.patientNumber || 0);
      return current > max ? current : max;
    }, 0);

    return Utils.padPatientNumber(maxNumber + 1);
  },

  add(patient) {
    const patients = this.getAll();
    patients.push(patient);
    this.saveAll(patients);
    return patient;
  },

  findById(patientId) {
    return this.getAll().find((patient) => patient.id === patientId) || null;
  },

  search(term) {
    const searchTerm = Utils.safeTrim(term).toLowerCase();
    const patients = this.getAll();

    if (!searchTerm) return patients;

    return patients.filter((patient) => {
      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      const patientNumber = String(patient.patientNumber || "").toLowerCase();

      return (
        fullName.includes(searchTerm) || patientNumber.includes(searchTerm)
      );
    });
  },
};