const ExamStartScreen = {
  title: "Untersuchung starten",

  render() {
    const patient = AppState.currentPatient;

    if (!patient) {
      return `
        <section class="screen exam-start-screen">
          <div class="card">
            <h2>Untersuchung starten</h2>
            <p>Kein Patient ausgewählt.</p>
            <div class="form-actions">
              <button id="btn-back-to-patients" class="primary-button" type="button">
                Zur Patientenliste
              </button>
            </div>
          </div>
        </section>
      `;
    }

    const settings = SettingsStore.get();
    const availableCameras = this.getAvailableCameras();
    const defaultCamera =
      availableCameras.find(
        (camera) => camera.deviceId === settings.defaultCamera
      ) || availableCameras[0];

    const reportMode = AppState.reportMode || settings.defaultMode || "fachkraft";

    const previewExam = ExamStore.createDraftExam(
      patient,
      reportMode,
      defaultCamera
    );

    return `
      <section class="screen exam-start-screen">
        <div class="card">
          <h2>Untersuchung starten</h2>

          <div class="info-line">
            <span>Patient</span>
            <strong>${Utils.escapeHtml(patient.firstName)} ${Utils.escapeHtml(patient.lastName)}</strong>
          </div>

          <div class="info-line">
            <span>Patientennummer</span>
            <strong>${Utils.escapeHtml(patient.patientNumber)}</strong>
          </div>

          <div class="info-line">
            <span>Untersuchungs-ID</span>
            <strong id="exam-id-preview">${Utils.escapeHtml(previewExam.examNumber)}</strong>
          </div>

          <div class="form-group">
            <label for="report-mode">Auswertungsmodus</label>
            <select id="report-mode">
              <option value="fachkraft" ${reportMode === "fachkraft" ? "selected" : ""}>Fachkraft</option>
              <option value="laie" ${reportMode === "laie" ? "selected" : ""}>Laie</option>
            </select>
          </div>

          <div class="form-group">
            <label for="camera-select">Kamera</label>
            <select id="camera-select">
              ${availableCameras
                .map(
                  (camera) => `
                    <option
                      value="${Utils.escapeHtml(camera.deviceId)}"
                      ${camera.deviceId === defaultCamera.deviceId ? "selected" : ""}
                    >
                      ${Utils.escapeHtml(camera.label)}
                    </option>
                  `
                )
                .join("")}
            </select>
          </div>

          <div class="form-actions">
            <button id="btn-start-exam" class="primary-button" type="button">
              Standardbilder aufnehmen
            </button>

            <button id="btn-cancel-exam-start" class="secondary-button" type="button">
              Zurück
            </button>
          </div>
        </div>
      </section>
    `;
  },

  bind() {
    document
      .getElementById("btn-back-to-patients")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.PATIENTS);
      });

    document
      .getElementById("btn-cancel-exam-start")
      ?.addEventListener("click", () => {
        Router.goBack();
      });

    document
      .getElementById("report-mode")
      ?.addEventListener("change", (event) => {
        AppState.reportMode = event.target.value;
        this.updateExamPreview();
      });

    document
      .getElementById("camera-select")
      ?.addEventListener("change", () => {
        this.updateExamPreview();
      });

    document
      .getElementById("btn-start-exam")
      ?.addEventListener("click", () => {
        const patient = AppState.currentPatient;
        if (!patient) {
          alert("Kein Patient ausgewählt.");
          return;
        }

        const reportModeElement = document.getElementById("report-mode");
        const cameraSelectElement = document.getElementById("camera-select");

        const reportMode = reportModeElement?.value || "fachkraft";
        const selectedDeviceId =
          cameraSelectElement?.value || "environment-camera";

        const selectedCamera = this.getAvailableCameras().find(
          (camera) => camera.deviceId === selectedDeviceId
        ) || {
          deviceId: "environment-camera",
          label: "Rückkamera",
        };

        const draftExam = ExamStore.createDraftExam(
          patient,
          reportMode,
          selectedCamera
        );

        const savedExam = ExamStore.add(draftExam);
        AppState.currentExam = savedExam;
        AppState.reportMode = reportMode;
        AppState.captureStatus.currentSlotIndex = 0;
        AppState.captureStatus.totalCaptured = 0;

        const patients = PatientStore.getAll();
        const patientIndex = patients.findIndex((item) => item.id === patient.id);

        if (patientIndex >= 0) {
          const currentIds = Array.isArray(patients[patientIndex].examinationIds)
            ? patients[patientIndex].examinationIds
            : [];

          currentIds.push(savedExam.id);

          patients[patientIndex] = {
            ...patients[patientIndex],
            examinationIds: currentIds,
            updatedAt: new Date().toISOString(),
          };

          PatientStore.saveAll(patients);
          AppState.currentPatient = patients[patientIndex];
        }

        Router.goTo(Routes.CAPTURE);
      });
  },

  getAvailableCameras() {
    return [
      { deviceId: "environment-camera", label: "Rückkamera" },
      { deviceId: "user-camera", label: "Frontkamera" },
    ];
  },

  updateExamPreview() {
    const patient = AppState.currentPatient;
    if (!patient) return;

    const reportModeElement = document.getElementById("report-mode");
    const cameraSelectElement = document.getElementById("camera-select");
    const previewElement = document.getElementById("exam-id-preview");

    if (!previewElement) return;

    const reportMode = reportModeElement?.value || "fachkraft";
    const selectedDeviceId =
      cameraSelectElement?.value || "environment-camera";

    const selectedCamera = this.getAvailableCameras().find(
      (camera) => camera.deviceId === selectedDeviceId
    ) || {
      deviceId: "environment-camera",
      label: "Rückkamera",
    };

    const previewExam = ExamStore.createDraftExam(
      patient,
      reportMode,
      selectedCamera
    );

    previewElement.textContent = previewExam.examNumber;
  },
};