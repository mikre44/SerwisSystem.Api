// Client-side validation for the "report a repair" form. Kept deliberately
// simple: format checks the user should see immediately (required fields,
// NIP checksum, phone, postal code). The backend is the source of truth and
// re-validates everything, including the product-specific serial number
// (see the product catalogue served by GET /api/products).

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTAL_CODE_REGEX = /^\d{2}-\d{3}$/;
const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7];

export const CUSTOM_PRODUCT_VALUE = "Other";

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

// Returns an object of { fieldName: message }, so each FormField can show
// its own error instead of one long list at the top of the page.
// `selectedProductMeta` is the matching entry from GET /api/products (or
// undefined for a custom product); only its serialRequired flag is used
// here -- the actual format is checked by the backend.
export function validateRepairForm(form, selectedProductMeta) {
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

  if (selectedProductMeta?.serialRequired && !form.serialNumber.trim()) {
    errors.serialNumber = "Numer seryjny jest wymagany dla wybranego produktu.";
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
