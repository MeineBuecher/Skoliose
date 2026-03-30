const PatientsScreen = {
  title: "Patienten",

  render(searchTerm = "") {
    const allPatients = Utils.safeArray(PatientStore.getAll?.() || []);
    const term = String(searchTerm || "").trim().toLowerCase();

    const patients = !term
      ? allPatients
      : allPatients.filter((patient) => {
          const fullName =
            `${patient.firstName || ""} ${patient.lastName || ""}`.toLowerCase();
          const patientNumber = String(patient.patientNumber || "").toLowerCase();
          return fullName.includes(term) || patientNumber.includes(term);
        });

    const sortedPatients = patients.sort((a, b) => {
      const nameA = `${a.lastName || ""} ${a.firstName || ""}`.toLowerCase();
      const nameB = `${b.lastName || ""} ${b.firstName || ""}`.toLowerCase();
      return nameA.localeCompare(nameB, "de");
    });

    return `
      <section class="screen patients-screen">
        <div class="card">
          <h2>Patienten</h2>

          <input
            id="patients-search"
            class="search-input"
            type="text"
            placeholder="Name oder Patientennummer suchen"
            value="${Utils.escapeHtml(searchTerm || "")}"
          />

          <div class="form-actions">
            <button id="btn-patient-new" class="primary-button" type="button">
              Neuen Patienten anlegen
            </button>

            <button id="btn-patients-back-home" class="secondary-button" type="button">
              Zur Startseite
            </button>
          </div>
        </div>

        ${
          sortedPatients.length === 0
            ? `
          <div class="empty-state">
            Noch keine Patienten vorhanden.
          </div>
        `
            : `
          <div class="patient-list">
            ${sortedPatients
              .map((patient) => {
                return `
                  <div class="patient-card">
                    <div class="patient-number">
                      ${Utils.escapeHtml(String(patient.patientNumber || "---"))}
                    </div>

                    <div class="patient-info">
                      <div class="patient-name">
                        ${Utils.escapeHtml(patient.firstName || "")}
                        ${Utils.escapeHtml(patient.lastName || "")}
                      </div>

                      <div class="patient-meta">
                        Geboren: ${Utils.escapeHtml(patient.birthDate || "-")}
                      </div>

                      <div class="patient-meta">
                        BMI: ${Utils.escapeHtml(String(patient.bmi ?? "-"))}
                      </div>
                    </div>

                    <div style="min-width:120px;">
                      <button
                        class="secondary-button btn-patient-open"
                        type="button"
                        data-patient-id="${Utils.escapeHtml(patient.id)}"
                      >
                        Öffnen
                      </button>
                    </div>
                  </div>
                `;
              })
              .join("")}
          </div>
        `
        }
      </section>
    `;
  },

  bind() {
    document.getElementById("btn-patient-new")?.addEventListener("click", () => {
      Router.goTo(Routes.PATIENT_FORM);
    });

    document
      .getElementById("btn-patients-back-home")
      ?.addEventListener("click", () => {
        Router.goTo(Routes.HOME);
      });

    document.getElementById("patients-search")?.addEventListener("input", (event) => {
      Router.loadScreen(Routes.PATIENTS, {
        searchTerm: event.target.value || "",
      });
    });

    document.querySelectorAll(".btn-patient-open").forEach((button) => {
      button.addEventListener("click", () => {
        const patientId = button.getAttribute("data-patient-id");
        const patient =
          Utils.safeArray(PatientStore.getAll?.() || []).find((item) => item.id === patientId) ||
          null;

        if (!patient) {
          alert("Patient konnte nicht geladen werden.");
          return;
        }

        AppState.currentPatient = patient;
        Router.goTo(Routes.EXAM_START);
      });
    });
  },
};