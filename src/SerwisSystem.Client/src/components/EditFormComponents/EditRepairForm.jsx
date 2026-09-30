import { useState } from "react";
import { updateRepair } from "../../api/api";
import useProducts from "../../hooks/useProducts";
import FieldError from "../FieldError";
import Message from "../Message";

// Value of the "Inny" option: the product name is then typed in by hand.
const CUSTOM_PRODUCT = "custom";

function isValidPhone(phone) {
  const cleaned = phone.replace(/[^\d+]/g, "");

  return /^(\+)?\d{7,15}$/.test(cleaned);
}

// Polish NIP: 10 digits, the last one is a checksum of the first nine.
function isValidNip(nip) {
  if (!/^\d{10}$/.test(nip)) {
    return false;
  }

  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];

  const sum = weights.reduce(
    (total, weight, index) => total + Number(nip[index]) * weight,
    0
  );

  const checksum = sum % 11;

  return checksum !== 10 && checksum === Number(nip[9]);
}

function isFutureDate(isoDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return new Date(`${isoDate}T00:00:00`) > today;
}

// Form state built from a repair returned by the API.
function toFormState(repair) {
  return {
    selectedProduct: repair.isCustomProduct ? CUSTOM_PRODUCT : repair.product,
    customProduct: repair.isCustomProduct ? repair.product : "",
    serialNumber: repair.serialNumber ?? "",
    description: repair.description ?? "",

    reporterName: repair.reporterName ?? "",
    reporterSurname: repair.reporterSurname ?? "",
    reporterPhone: repair.reporterPhone ?? "",
    reporterEmail: repair.reporterEmail ?? "",

    companyName: repair.companyName ?? "",
    companyAddress: repair.companyAddress ?? "",
    companyPostalCode: repair.companyPostalCode ?? "",
    companyCity: repair.companyCity ?? "",
    companyNip: repair.companyNip ?? "",

    hasWarranty: repair.hasWarranty ?? false,
    purchaseDate: repair.purchaseDate ?? "",
    purchaseInvoiceNumber: repair.purchaseInvoiceNumber ?? "",

    hasContract: repair.hasContract ?? false,
    contractNumber: repair.contractNumber ?? "",
  };
}

// Body of PUT /api/repairs/{id}. The status is not part of it:
// it changes only through the workflow actions or the admin status correction.
function toUpdateRequest(form) {
  const isCustomProduct = form.selectedProduct === CUSTOM_PRODUCT;

  return {
    product: isCustomProduct ? form.customProduct.trim() : form.selectedProduct,
    isCustomProduct,
    serialNumber: form.serialNumber.trim() || null,
    description: form.description.trim(),

    reporterName: form.reporterName.trim(),
    reporterSurname: form.reporterSurname.trim(),
    reporterPhone: form.reporterPhone.replace(/[^\d+]/g, ""),
    reporterEmail: form.reporterEmail.trim(),

    companyName: form.companyName.trim(),
    companyAddress: form.companyAddress.trim(),
    companyPostalCode: form.companyPostalCode.trim(),
    companyCity: form.companyCity.trim(),
    companyNip: form.companyNip.replace(/\s/g, ""),

    hasWarranty: form.hasWarranty,
    purchaseDate: form.hasWarranty ? form.purchaseDate : null,
    purchaseInvoiceNumber: form.hasWarranty
      ? form.purchaseInvoiceNumber.trim()
      : null,

    hasContract: form.hasContract,
    contractNumber: form.hasContract ? form.contractNumber.trim() : null,
  };
}

// Returns { fieldName: [message] }, the same shape as the API's validation `errors`,
// so client-side and server-side messages are shown in the same place.
// The serial number format is checked only by the API, so the rules live in one place.
function validateForm(form, serialRequired) {
  const errors = {};

  function addError(field, message) {
    errors[field] = [message];
  }

  const isCustomProduct = form.selectedProduct === CUSTOM_PRODUCT;

  if (!form.selectedProduct) {
    addError("product", "Wybierz produkt.");
  } else if (isCustomProduct && !form.customProduct.trim()) {
    addError("product", "Podaj nazwę urządzenia niewystępującego na liście.");
  }

  if (serialRequired && !form.serialNumber.trim()) {
    addError("serialNumber", "Numer seryjny jest wymagany dla wybranego produktu.");
  }

  if (!form.description.trim()) {
    addError("description", "Opis usterki jest wymagany.");
  }

  if (!form.reporterName.trim()) {
    addError("reporterName", "Imię osoby zgłaszającej jest wymagane.");
  }

  if (!form.reporterSurname.trim()) {
    addError("reporterSurname", "Nazwisko osoby zgłaszającej jest wymagane.");
  }

  if (!form.reporterPhone.trim()) {
    addError("reporterPhone", "Numer telefonu jest wymagany.");
  } else if (!isValidPhone(form.reporterPhone)) {
    addError("reporterPhone", "Numer telefonu jest nieprawidłowy.");
  }

  if (!form.reporterEmail.trim()) {
    addError("reporterEmail", "Adres e-mail jest wymagany.");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.reporterEmail.trim())) {
    addError("reporterEmail", "Adres e-mail jest nieprawidłowy.");
  }

  if (!form.companyName.trim()) {
    addError("companyName", "Nazwa firmy jest wymagana.");
  }

  if (!form.companyAddress.trim()) {
    addError("companyAddress", "Adres firmy jest wymagany.");
  }

  if (!/^\d{2}-\d{3}$/.test(form.companyPostalCode.trim())) {
    addError("companyPostalCode", "Kod pocztowy musi mieć format XX-XXX.");
  }

  if (!form.companyCity.trim()) {
    addError("companyCity", "Miasto jest wymagane.");
  }

  if (!/^\d{10}$/.test(form.companyNip)) {
    addError("companyNip", "NIP musi składać się dokładnie z 10 cyfr.");
  } else if (!isValidNip(form.companyNip)) {
    addError("companyNip", "Podany NIP jest nieprawidłowy.");
  }

  if (form.hasWarranty) {
    if (!form.purchaseDate) {
      addError("purchaseDate", "Data zakupu jest wymagana przy naprawie gwarancyjnej.");
    } else if (isFutureDate(form.purchaseDate)) {
      addError("purchaseDate", "Data zakupu nie może być datą przyszłą.");
    }

    if (!form.purchaseInvoiceNumber.trim()) {
      addError("purchaseInvoiceNumber", "Numer faktury jest wymagany przy naprawie gwarancyjnej.");
    }
  }

  if (form.hasContract && !form.contractNumber.trim()) {
    addError("contractNumber", "Numer umowy jest wymagany.");
  }

  return errors;
}

// One labelled input with its validation messages.
function TextField({ name, label, value, onChange, errors, ...inputProps }) {
  const id = `repair-${name}`;

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} name={name} value={value} onChange={onChange} {...inputProps} />
      <FieldError messages={errors} />
    </div>
  );
}

// Edits the data of a repair (not its status).
// The parent renders it with key={repair.id}, so another repair gets a fresh form.
// After saving, onUpdated(updatedRepair) receives the repair returned by the API.
function EditRepairForm({ repair, onUpdated }) {
  const { products, error: productsError } = useProducts();

  const [form, setForm] = useState(() => toFormState(repair));
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const isCustomProduct = form.selectedProduct === CUSTOM_PRODUCT;
  const catalogueProduct = products.find(
    (product) => product.name === form.selectedProduct
  );
  const serialRequired = !isCustomProduct && catalogueProduct?.serialRequired === true;

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleChange(event) {
    const { name, type, value, checked } = event.target;

    updateField(name, type === "checkbox" ? checked : value);
  }

  function handleProductChange(event) {
    // A serial number belongs to one product, so it is cleared on product change.
    setForm((current) => ({
      ...current,
      selectedProduct: event.target.value,
      serialNumber: "",
    }));
  }

  function handleNipChange(event) {
    updateField("companyNip", event.target.value.replace(/\D/g, "").slice(0, 10));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateForm(form, serialRequired);

    setFieldErrors(validationErrors);
    setSuccess("");

    if (Object.keys(validationErrors).length > 0) {
      setError("Popraw zaznaczone pola.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const updatedRepair = await updateRepair(repair.id, toUpdateRequest(form));

      // The API may normalise values (e.g. the e-mail), so show what was saved.
      setForm(toFormState(updatedRepair));
      setSuccess("Dane naprawy zostały zapisane.");
      onUpdated(updatedRepair);
    } catch (error) {
      setError(error.message);
      setFieldErrors(error.fieldErrors ?? {});
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2>Edytuj naprawę</h2>

      <Message error={error} success={success} />

      {productsError && (
        <p>Nie udało się pobrać listy produktów: {productsError}</p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <h3>Urządzenie</h3>

        <div>
          <label htmlFor="repair-product">Produkt</label>
          <select
            id="repair-product"
            name="selectedProduct"
            value={form.selectedProduct}
            onChange={handleProductChange}
          >
            <option value="">Wybierz produkt</option>

            {products.map((product) => (
              <option key={product.name} value={product.name}>
                {product.name}
              </option>
            ))}

            <option value={CUSTOM_PRODUCT}>Inny</option>
          </select>
          {!isCustomProduct && <FieldError messages={fieldErrors.product} />}
        </div>

        {isCustomProduct && (
          <TextField
            name="customProduct"
            label="Nazwa urządzenia"
            value={form.customProduct}
            onChange={handleChange}
            errors={fieldErrors.product}
          />
        )}

        <TextField
          name="serialNumber"
          label={serialRequired ? "Numer seryjny" : "Numer seryjny (opcjonalnie)"}
          placeholder={catalogueProduct?.serialHint ?? ""}
          value={form.serialNumber}
          onChange={handleChange}
          errors={fieldErrors.serialNumber}
        />

        <div>
          <label htmlFor="repair-description">Opis usterki</label>
          <textarea
            id="repair-description"
            name="description"
            value={form.description}
            onChange={handleChange}
          />
          <FieldError messages={fieldErrors.description} />
        </div>

        <h3>Dane osoby zgłaszającej</h3>

        <TextField
          name="reporterName"
          label="Imię"
          value={form.reporterName}
          onChange={handleChange}
          errors={fieldErrors.reporterName}
        />

        <TextField
          name="reporterSurname"
          label="Nazwisko"
          value={form.reporterSurname}
          onChange={handleChange}
          errors={fieldErrors.reporterSurname}
        />

        <TextField
          name="reporterPhone"
          label="Telefon"
          type="tel"
          value={form.reporterPhone}
          onChange={handleChange}
          errors={fieldErrors.reporterPhone}
        />

        <TextField
          name="reporterEmail"
          label="E-mail"
          type="email"
          value={form.reporterEmail}
          onChange={handleChange}
          errors={fieldErrors.reporterEmail}
        />

        <h3>Dane firmy</h3>

        <TextField
          name="companyName"
          label="Nazwa firmy"
          value={form.companyName}
          onChange={handleChange}
          errors={fieldErrors.companyName}
        />

        <TextField
          name="companyAddress"
          label="Adres"
          value={form.companyAddress}
          onChange={handleChange}
          errors={fieldErrors.companyAddress}
        />

        <TextField
          name="companyPostalCode"
          label="Kod pocztowy"
          placeholder="00-000"
          value={form.companyPostalCode}
          onChange={handleChange}
          errors={fieldErrors.companyPostalCode}
        />

        <TextField
          name="companyCity"
          label="Miasto"
          value={form.companyCity}
          onChange={handleChange}
          errors={fieldErrors.companyCity}
        />

        <TextField
          name="companyNip"
          label="NIP"
          inputMode="numeric"
          maxLength={10}
          value={form.companyNip}
          onChange={handleNipChange}
          errors={fieldErrors.companyNip}
        />

        <h3>Gwarancja</h3>

        <label>
          <input
            type="checkbox"
            name="hasWarranty"
            checked={form.hasWarranty}
            onChange={handleChange}
          />
          Naprawa gwarancyjna
        </label>

        {form.hasWarranty && (
          <>
            <TextField
              name="purchaseDate"
              label="Data zakupu"
              type="date"
              value={form.purchaseDate}
              onChange={handleChange}
              errors={fieldErrors.purchaseDate}
            />

            <TextField
              name="purchaseInvoiceNumber"
              label="Numer faktury"
              value={form.purchaseInvoiceNumber}
              onChange={handleChange}
              errors={fieldErrors.purchaseInvoiceNumber}
            />
          </>
        )}

        <h3>Umowa</h3>

        <label>
          <input
            type="checkbox"
            name="hasContract"
            checked={form.hasContract}
            onChange={handleChange}
          />
          Zgłoszenie w ramach umowy
        </label>

        {form.hasContract && (
          <TextField
            name="contractNumber"
            label="Numer umowy"
            value={form.contractNumber}
            onChange={handleChange}
            errors={fieldErrors.contractNumber}
          />
        )}

        <h3>Zgody</h3>

        <p>
          Zgoda na przetwarzanie danych w celu realizacji serwisu:{" "}
          <strong>{repair.serviceDataConsent ? "Tak" : "Nie"}</strong>
        </p>

        <p>
          Zgoda marketingowa:{" "}
          <strong>{repair.marketingConsent ? "Tak" : "Nie"}</strong>
        </p>

        <small>
          Zgody udzielone przez klienta nie mogą być zmieniane przez
          pracowników ani administratorów.
        </small>

        <div>
          <button type="submit" disabled={saving}>
            {saving ? "Zapisywanie..." : "Zapisz zmiany"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditRepairForm;
