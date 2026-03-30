const Routes = {
  HOME: "home",
  PATIENTS: "patients",
  PATIENT_FORM: "patient-form",
  EXAM_START: "exam-start",
  CAPTURE: "capture",
  THERMAL: "thermal",
  REVIEW: "review",
  ANALYSIS: "analysis",
  SUMMARY: "summary",
  DETAILS: "details",
  SPINE3D: "spine3d",
  IMAGES: "images",
  REPORT: "report",
  COMPARISON: "comparison",
  SETTINGS: "settings",
};

const StorageKeys = {
  PATIENTS: "skoliose_patients_v1",
  EXAMS: "skoliose_exams_v1",
  IMAGE_SETS: "skoliose_image_sets_v1",
};

const GenderOptions = {
  MALE: "male",
  FEMALE: "female",
  DIVERSE: "diverse",
};

const CaptureSequence = [
  { slot: "front_1", view: "front", indexInView: 1, totalIndex: 1, label: "Vorne" },
  { slot: "front_2", view: "front", indexInView: 2, totalIndex: 2, label: "Vorne" },
  { slot: "front_3", view: "front", indexInView: 3, totalIndex: 3, label: "Vorne" },
  { slot: "back_1", view: "back", indexInView: 1, totalIndex: 4, label: "Hinten" },
  { slot: "back_2", view: "back", indexInView: 2, totalIndex: 5, label: "Hinten" },
  { slot: "back_3", view: "back", indexInView: 3, totalIndex: 6, label: "Hinten" },
  { slot: "left_1", view: "left", indexInView: 1, totalIndex: 7, label: "Links" },
  { slot: "left_2", view: "left", indexInView: 2, totalIndex: 8, label: "Links" },
  { slot: "left_3", view: "left", indexInView: 3, totalIndex: 9, label: "Links" },
  { slot: "right_1", view: "right", indexInView: 1, totalIndex: 10, label: "Rechts" },
  { slot: "right_2", view: "right", indexInView: 2, totalIndex: 11, label: "Rechts" },
  { slot: "right_3", view: "right", indexInView: 3, totalIndex: 12, label: "Rechts" },
];

const ThermalSequence = [
  { slot: "thermal_back_1", view: "back", indexInView: 1, totalIndex: 1, label: "Hinten" },
  { slot: "thermal_back_2", view: "back", indexInView: 2, totalIndex: 2, label: "Hinten" },
  { slot: "thermal_back_3", view: "back", indexInView: 3, totalIndex: 3, label: "Hinten" },
  { slot: "thermal_left45_1", view: "left45", indexInView: 1, totalIndex: 4, label: "Links 45°" },
  { slot: "thermal_left45_2", view: "left45", indexInView: 2, totalIndex: 5, label: "Links 45°" },
  { slot: "thermal_left45_3", view: "left45", indexInView: 3, totalIndex: 6, label: "Links 45°" },
  { slot: "thermal_right45_1", view: "right45", indexInView: 1, totalIndex: 7, label: "Rechts 45°" },
  { slot: "thermal_right45_2", view: "right45", indexInView: 2, totalIndex: 8, label: "Rechts 45°" },
  { slot: "thermal_right45_3", view: "right45", indexInView: 3, totalIndex: 9, label: "Rechts 45°" },
];