// Client-side validation for the "report a repair" form. Kept deliberately
// simple: format checks the user should see immediately (required fields,
// NIP checksum, phone, postal code). The backend is the source of truth and
// re-validates everything, including the product-specific serial number.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTAL_CODE_REGEX = /^\d{2}-\d{3}$/;
const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7];

export const CUSTOM_PRODUCT_VALUE = "Other";

// TODO(#15): temporary local copy of the product list, moved here as-is
// from the original CreateRepair.jsx. Will be replaced by GET /api/products
// once the backend exposes the shared catalogue.
export const PRODUCT_RULES = {
  "Monitor interaktywny myBoard Titan (Android 15)": {
    checkVersion: "new",
    expectedNumber: "05",
  },
  "Monitor interaktywny myBoard Grey Arrow (Android 13)": {
    checkVersion: "old",
    expectedNumber: "13",
  },
  "Monitor interaktywny myBoard Panda (Android 13)": {
    checkVersion: "new",
    expectedNumber: "02",
  },
  "Monitor interaktywny myBoard Black Arrow (Android 13)": {
    checkVersion: "new",
    expectedNumber: "01",
  },
  "Monitor interaktywny myBoard Grey Rock (Android 11)": {
    checkVersion: "old",
    expectedNumber: "11",
  },
  "Monitor interaktywny myBoard Grey Rock 2.0 (Android 11)": {
    checkVersion: "old",
    expectedNumber: "11",
  },
  "Monitor interaktywny myBoard White Arrow (Android 14)": {
    checkVersion: "new",
    expectedNumber: "04",
  },
  "Monitor interaktywny myBoard Panda 2.0 (Android 14)": {
    checkVersion: "new",
    expectedNumber: "03",
  },
  "Monitor interaktywny (model spoza listy)": {
    checkVersion: "generic",
    expectedNumber: null,
  },
  "Tablica interaktywna myBoard Silver": {
    checkVersion: "generic",
    expectedNumber: null,
  },
  "Tablica interaktywna myBoard Black": {
    checkVersion: "generic",
    expectedNumber: null,
  },
};

export const PRODUCTS = [
  ...Object.keys(PRODUCT_RULES),
  "Akcesoria do tablic interaktywnych myBoard",
  "Akcesoria dla monitorów interaktywnych myBoard",
  "Pracownie językowe",
  "Podłoga interaktywna SmartFloor",
  "Meble",
  "Systemy konferencyjne",
  "Projektory",
  "Laptop",
];

// Polish NIP (tax id) checksum: the last digit must equal a weighted sum
// of the first nine digits, mod 11.
export function isValidNip(nip) {
  if (!/^\d{10}$/.test(nip)) {
    return false;
  }

  const sum = NIP_WEIGHTS.reduce(
    (total, weight, index) => total + Number(nip[index]) * weight,
    0
  );

  const checksum = sum % 11;

  return checksum !== 10 && checksum === Number(nip[9]);
}

export function isValidPhone(phone) {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return /^(\+)?\d{7,15}$/.test(cleaned);
}

export function validateSerialNumber(serialNumber, product) {
  const serial = serialNumber.trim();
  const rule = PRODUCT_RULES[product];

  // Products such as laptop, projector, furniture etc. have no serial rule.
  if (!rule) {
    return { valid: true };
  }

  if (rule.checkVersion === "new") {
    const match = serial.match(/^L(\d{6})(\d{2})(55|65|75|86|98)(\d{5})$/);

    if (!match) {
      return {
        valid: false,
        message: "Numer seryjny ma nieprawidłowy format dla wybranego monitora.",
      };
    }

    if (match[2] !== rule.expectedNumber) {
      return {
        valid: false,
        message: "Numer seryjny nie odpowiada wybranemu modelowi monitora.",
      };
    }

    return { valid: true };
  }

  if (rule.checkVersion === "old") {
    const match = serial.match(/^(\d{4})(8|11|13)\d(55|65|75|86|98)(\d{3})z$/i);

    if (!match) {
      return {
        valid: false,
        message: "Numer seryjny ma nieprawidłowy format dla wybranego monitora.",
      };
    }

    const androidVersion = match[2];

    if (androidVersion !== rule.expectedNumber) {
      return {
        valid: false,
        message:
          `Numer seryjny wskazuje Android ${androidVersion}, ` +
          `a wybrany monitor ma Android ${rule.expectedNumber}.`,
      };
    }

    return { valid: true };
  }

  if (rule.checkVersion === "generic") {
    if (!/^[A-Za-z0-9._/-]{4,40}$/.test(serial)) {
      return {
        valid: false,
        message: "Numer seryjny musi mieć od 4 do 40 dozwolonych znaków.",
      };
    }

    return { valid: true };
  }

  return { valid: false, message: "Nie można zweryfikować numeru seryjnego." };
}

// Returns an object of { fieldName: message }, so each FormField can show
// its own error instead of one long list at the top of the page.
export function validateRepairForm(form) {
  const errors = {};

  if (!form.reporterName.trim()) {
    errors.reporterName = "Imię osoby zgłaszającej jest wymagane.";
  }

  if (!form.reporterSurname.trim()) {
    errors.reporterSurname = "Nazwisko osoby zgłaszającej jest wymagane.";
  }

  if (!form.reporterPhone.trim()) {
    errors.reporterPhone = "Numer telefonu jest wymagany.";
  } else if (!isValidPhone(form.reporterPhone)) {
    errors.reporterPhone = "Numer telefonu jest nieprawidłowy.";
  }

  if (!form.reporterEmail.trim()) {
    errors.reporterEmail = "Adres e-mail jest wymagany.";
  } else if (!EMAIL_REGEX.test(form.reporterEmail.trim())) {
    errors.reporterEmail = "Adres e-mail jest nieprawidłowy.";
  }

  if (form.reporterEmail.trim() !== form.confirmEmail.trim()) {
    errors.confirmEmail = "Adresy e-mail nie są takie same.";
  }

  if (!form.companyName.trim()) {
    errors.companyName = "Nazwa firmy jest wymagana.";
  }

  if (!form.companyAddress.trim()) {
    errors.companyAddress = "Adres firmy jest wymagany.";
  }

  if (!POSTAL_CODE_REGEX.test(form.companyPostalCode.trim())) {
    errors.companyPostalCode = "Kod pocztowy musi mieć format XX-XXX.";
  }

  if (!form.companyCity.trim()) {
    errors.companyCity = "Miasto jest wymagane.";
  }

  if (!/^\d{10}$/.test(form.companyNip)) {
    errors.companyNip = "NIP musi składać się dokładnie z 10 cyfr.";
  } else if (!isValidNip(form.companyNip)) {
    errors.companyNip = "Podany NIP jest nieprawidłowy.";
  }

  if (!form.product) {
    errors.product = "Wybierz produkt.";
  } else if (
    form.product === CUSTOM_PRODUCT_VALUE &&
    !form.customProductName.trim()
  ) {
    errors.customProductName =
      "Podaj nazwę urządzenia niewystępującego na liście.";
  }

  const serialRule = PRODUCT_RULES[form.product];

  if (serialRule) {
    if (!form.serialNumber.trim()) {
      errors.serialNumber = "Numer seryjny jest wymagany dla wybranego produktu.";
    } else {
      const serialValidation = validateSerialNumber(form.serialNumber, form.product);

      if (!serialValidation.valid) {
        errors.serialNumber = serialValidation.message;
      }
    }
  }

  if (!form.description.trim()) {
    errors.description = "Opis usterki jest wymagany.";
  }

  if (form.hasWarranty) {
    if (!form.purchaseDate) {
      errors.purchaseDate = "Data zakupu jest wymagana przy naprawie gwarancyjnej.";
    } else {
      const selectedDate = new Date(`${form.purchaseDate}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        errors.purchaseDate = "Data zakupu nie może być datą przyszłą.";
      }
    }

    if (!form.purchaseInvoiceNumber.trim()) {
      errors.purchaseInvoiceNumber =
        "Numer faktury zakupu jest wymagany przy naprawie gwarancyjnej.";
    }
  }

  if (form.hasContract && !form.contractNumber.trim()) {
    errors.contractNumber = "Numer umowy jest wymagany po zaznaczeniu opcji umowy.";
  }

  if (!form.serviceDataConsent) {
    errors.serviceDataConsent =
      "Zgoda na przetwarzanie danych w celu realizacji serwisu jest wymagana.";
  }

  return errors;
}
