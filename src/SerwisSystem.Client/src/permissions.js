// Permission keys exactly as the API sends them in `user.permissions` (camelCase).
// Every screen that lists permissions reads its labels from here, so a label
// can never differ between the read-only view and the edit form.
export const PERMISSION_LABELS = {
  readRepairs: "Odczyt napraw",
  takeRepairs: "Przyjmowanie napraw",
  editRepairs: "Edycja napraw",
  deleteRepairs: "Usuwanie napraw",
  // The API checks DischargeUsers when someone returns a repair
  // that is assigned to another worker (POST /repairs/{id}/return).
  dischargeUsers: "Zwracanie cudzych napraw",

  readUsers: "Odczyt użytkowników",
  editUsers: "Edycja użytkowników",
  deleteUsers: "Usuwanie użytkowników",
  grantUsers: "Nadawanie uprawnień",
};

export const PERMISSION_KEYS = Object.keys(PERMISSION_LABELS);

// The same permissions split into the sections shown in the edit form.
export const PERMISSION_GROUPS = [
  {
    title: "Naprawy",
    keys: ["readRepairs", "takeRepairs", "editRepairs", "deleteRepairs", "dischargeUsers"],
  },
  {
    title: "Użytkownicy",
    keys: ["readUsers", "editUsers", "deleteUsers", "grantUsers"],
  },
];
