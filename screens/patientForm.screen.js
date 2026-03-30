const PatientFormScreen = {
  title: "Patient anlegen",

  render() {
    const patient = AppState.currentPatient || null;
    const isEditMode = Boolean(patient && patient.id);

    return `
      <section class="screen patient-form-screen">
        <div class="card">
          <h2>${isEditMode ? "Patient bearbeiten" : "Patient anlegen"}</h2>

          <div class="form-group">
            <label for="patient-first-name">Vorname</label>
            <input
              id="patient-first-name"
              type="text"
              value="${Utils.escapeHtml(patient?.firstName || "")}"
            />
          </div>

          <div class="form-group">
            <label for="patient-last-name">Nachname</label>
            <input
              id="patient-last-name"
              type="text"
              value="${Utils.escapeHtml(patient?.lastName || "")}"
            />
          </div>

          <div class="form-group">
            <label for="patient-birth-date">Geburtsdatum</label>
            <input
              id="patient-birth-date"
              type="date"
              value="${Utils.escapeHtml(patient?.birthDate || "")}"
            />
          </div>

          <div class="form-group">
            <label for="patient-gender">Geschlecht</label>
            <select id="patient-gender">
              <option value="">Bitte wählen</option>
              <option value="male" ${patient?.gender === "male" ? "selected" : ""}>Männlich</option>
              <option value="female" ${patient?.gender === "female" ? "selected" : ""}>Weiblich</option>
              <option value="diverse" ${patient?.gender === "diverse" ? "selected" : ""}>Divers</option>
            </select>
          </div>

          <div class="form-group">
            <label for="patient-height-cm">Größe (cm)</label>
            <input
              id="patient-height-cm"
              type="number"
              inputmode="decimal"
              value="${Utils.escapeHtml(String(patient?.heightCm ?? ""))}"
            />
          </div>

          <div class="form-group">
            <label for="patient-weight-kg">Gewicht (kg)</label>
            <input
              id="patient-weight-kg"
              type="number"
              inputmode="decimal"
              value="${Utils.escapeHtml(String(patient?.weightKg ?? ""))}"
            />
          </div>

          <div class="form-result">
            <div class="form-result-row">
              <span>Alter</span>
              <strong id="patient-age-preview">${Utils.escapeHtml(String(patient?.ageYears ?? "-"))}</strong>
            </div>
            <div class="form-result-row">
              <span>BMI</span>
              <strong id="patient-bmi-preview">${Utils.escapeHtml(String(patient?.bmi ?? "-"))}</strong>
            </div>
            <div class="form-result-row">
              <span>Altersstufe</span>
              <strong id="patient-age-group-preview">${Utils.escapeHtml(patient?.ageGroupLabel || "-")}</strong>
            </div>
          </div>

          <div class="form-actions">
            <button id="btn-patient-save" class="primary-button" type="button">
              ${isEditMode ? "Änderungen speichern" : "Patient speichern"}
            </button>

            <button id="btn-patient-cancel" class="secondary-button" type="button">
              Abbrechen
            </button>
          </div>
        </div>
      </section>
    `;
  },

  bind() {
    ["patient-birth-date", "patient-height-cm", "patient-weight-kg"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", () => {
        this.updatePreview();
      });
    });

    document.getElementById("btn-patient-save")?.addEventListener("click", () => {
      this.savePatient();
    });

    document.getElementById("btn-patient-cancel")?.addEventListener("click", () => {
      Router.goTo(Routes.PATIENTS);
    });

    this.updatePreview();
  },

  updatePreview() {
    const birthDate = document.getElementById("patient-birth-date")?.value || "";
    const heightCm = Utils.toNumber(document.getElementById("patient-height-cm")?.value, 0);
    const weightKg = Utils.toNumber(document.getElementById("patient-weight-kg")?.value, 0);

    const ageYears = this.calculateAgeYears(birthDate);
    const bmi = this.calculateBmi(heightCm, weightKg);
    const ageGroupLabel = this.getAgeGroupLabel(ageYears);

    const ageEl = document.getElementById("patient-age-preview");
    const bmiEl = document.getElementById("patient-bmi-preview");
    const ageGroupEl = document.getElementById("patient-age-group-preview");

    if (ageEl) ageEl.textContent = ageYears >= 0 ? String(ageYears) : "-";
    if (bmiEl) bmiEl.textContent = bmi > 0 ? String(bmi) : "-";
    if (ageGroupEl) ageGroupEl.textContent = ageGroupLabel || "-";
  },

  savePatient() {
    const firstName = (document.getElementById("patient-first-name")?.value || "").trim();
    const lastName = (document.getElementById("patient-last-name")?.value || "").trim();
    const birthDate = document.getElementById("patient-birth-date")?.value || "";
    const gender = document.getElementById("patient-gender")?.value || "";
    const heightCm = Utils.toNumber(document.getElementById("patient-height-cm")?.value, 0);
    const weightKg = Utils.toNumber(document.getElementById("patient-weight-kg")?.value, 0);

    if (!firstName || !lastName) {
      alert("Bitte Vorname und Nachname eingeben.");
      return;
    }

    if (!birthDate) {
      alert("Bitte Geburtsdatum eingeben.");
      return;
    }

    const ageYears = this.calculateAgeYears(birthDate);
    const bmi = this.calculateBmi(heightCm, weightKg);
    const ageGroupLabel = this.getAgeGroupLabel(ageYears);

    const allPatients = Utils.safeArray(PatientStore.getAll?.() || []);
    const currentPatient = AppState.currentPatient && AppState.currentPatient.id
      ? AppState.currentPatient
      : null;

    let savedPatient = null;

    if (currentPatient) {
      const index = allPatients.findIndex((item) => item.id === currentPatient.id);
      if (index === -1) {
        alert("Patient konnte nicht aktualisiert werden.");
        return;
      }

      savedPatient = {
        ...allPatients[index],
        firstName,
        lastName,
        birthDate,
        gender,
        heightCm,
        weightKg,
        bmi,
        ageYears,
        ageGroupLabel,
        updatedAt: new Date().toISOString(),
      };

      allPatients[index] = savedPatient;
    } else {
      savedPatient = {
        id: `patient_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        patientNumber: this.getNextPatientNumber(allPatients),
        firstName,
        lastName,
        birthDate,
        gender,
        heightCm,
        weightKg,
        bmi,
        ageYears,
        ageGroupLabel,
        examinationIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      allPatients.push(savedPatient);
    }

    if (!PatientStore.saveAll) {
      alert("Patientenspeicher ist nicht verfügbar.");
      return;
    }

    PatientStore.saveAll(allPatients);
    AppState.currentPatient = savedPatient;

    Router.goTo(Routes.EXAM_START);
  },

  calculateAgeYears(birthDate) {
    if (!birthDate) return -1;

    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return -1;

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age -= 1;
    }

    return age >= 0 ? age : -1;
  },

  calculateBmi(heightCm, weightKg) {
    if (heightCm <= 0 || weightKg <= 0) return 0;
    const heightM = heightCm / 100;
    return Number((weightKg / (heightM * heightM)).toFixed(1));
  },

  getAgeGroupLabel(ageYears) {
    if (ageYears < 0) return "-";
    if (ageYears <= 1) return "Säugling 1–18 Monate";
    if (ageYears <= 8) return "Kleinkind 1 1/2 bis 8 Jahre";
    if (ageYears <= 21) return "Jugendlich 9–21 Jahre";
    if (ageYears <= 65) return "Erwachsen 22–65 Jahre";
    if (ageYears <= 80) return "Alter Mensch 66–80 Jahre";
    return "Sehr alter Mensch ab 81 Jahre";
  },

  getNextPatientNumber(patients) {
    const maxNumber = Utils.safeArray(patients).reduce((max, patient) => {
      const num = parseInt(String(patient.patientNumber || "0"), 10);
      return Number.isFinite(num) ? Math.max(max, num) : max;
    }, 0);

    return String(maxNumber + 1).padStart(3, "0");
  },
};