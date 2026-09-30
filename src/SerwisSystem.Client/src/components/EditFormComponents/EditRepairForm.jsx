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
// The API accepts only exact catalogue names when isCustomProduct is false,
// so a product that is not (or no longer) in the catalogue is edited as a custom one.
function toFormState(repair, products) {
  const product = repair.product ?? "";
  const inCatalogue = products.some((item) => item.name === product);
  const isCustom = product !== "" && (repair.isCustomProduct || !inCatalogue);

  return {
    selectedProduct: isCustom ? CUSTOM_PRODUCT : product,
    customProduct: isCustom ? product : "",
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

// One labelled Bootstrap input with its validation messages.
// This is the only place that styles a text/date/email/tel input in this form.
function TextField({ name, label, value, onChange, errors, className = "col-md-6", ...inputProps }) {
  const id = `repair-${name}`;
  const hasError = Boolean(errors && errors.length > 0);

  return (
    <div className={className}>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`form-control${hasError ? " is-invalid" : ""}`}
        {...inputProps}
      />
      <FieldError messages={errors} />
    </div>
  );
}

// The form itself. Its state is seeded from the product catalogue,
// so EditRepairForm renders it only after the catalogue has loaded.
function RepairDataForm({ repair, products, onUpdated }) {
  const [form, setForm] = useState(() => toFormState(repair, products));
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
      setForm(toFormState(updatedRepair, products));
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
    <>
      <Message error={error} success={success} />

      <form onSubmit={handleSubmit} noValidate>
        <h3 className="h6 text-uppercase text-body-secondary border-bottom pb-2 mb-3">
          Urządzenie
        </h3>

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <label htmlFor="repair-product" className="form-label">
              Produkt
            </label>
            <select
              id="repair-product"
              name="selectedProduct"
              className={`form-select${!isCustomProduct && fieldErrors.product ? " is-invalid" : ""}`}
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

          <div className="col-12">
            <label htmlFor="repair-description" className="form-label">
              Opis usterki
            </label>
            <textarea
              id="repair-description"
              name="description"
              rows={3}
              className={`form-control${fieldErrors.description ? " is-invalid" : ""}`}
              value={form.description}
              onChange={handleChange}
            />
            <FieldError messages={fieldErrors.description} />
          </div>
        </div>

        <h3 className="h6 text-uppercase text-body-secondary border-bottom pb-2 mb-3">
          Zgłaszający
        </h3>

        <div className="row g-3 mb-4">
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
        </div>

        <h3 className="h6 text-uppercase text-body-secondary border-bottom pb-2 mb-3">
          Firma
        </h3>

        <div className="row g-3 mb-4">
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
        </div>

        <h3 className="h6 text-uppercase text-body-secondary border-bottom pb-2 mb-3">
          Gwarancja i umowa
        </h3>

        <div className="row g-3 mb-4">
          <div className="col-12">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="repair-hasWarranty"
                name="hasWarranty"
                checked={form.hasWarranty}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="repair-hasWarranty">
                Naprawa gwarancyjna
              </label>
            </div>
          </div>

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

          <div className="col-12">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="repair-hasContract"
                name="hasContract"
                checked={form.hasContract}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="repair-hasContract">
                Zgłoszenie w ramach umowy
              </label>
            </div>
          </div>

          {form.hasContract && (
            <TextField
              name="contractNumber"
              label="Numer umowy"
              value={form.contractNumber}
              onChange={handleChange}
              errors={fieldErrors.contractNumber}
            />
          )}
        </div>

        <h3 className="h6 text-uppercase text-body-secondary border-bottom pb-2 mb-3">
          Zgody
        </h3>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <div className="text-body-secondary small">
              Zgoda na przetwarzanie danych w celu realizacji serwisu
            </div>
            <div>
              <strong>{repair.serviceDataConsent ? "Tak" : "Nie"}</strong>
            </div>
          </div>

          <div className="col-md-6">
            <div className="text-body-secondary small">Zgoda marketingowa</div>
            <div>
              <strong>{repair.marketingConsent ? "Tak" : "Nie"}</strong>
            </div>
          </div>
        </div>

        <p className="small text-body-secondary">
          Zgody udzielone przez klienta nie mogą być zmieniane przez
          pracowników ani administratorów.
        </p>

        <div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            {saving ? "Zapisywanie…" : "Zapisz zmiany"}
          </button>
        </div>
      </form>
    </>
  );
}

// Edits the data of a repair (not its status).
// The parent renders it with key={repair.id}, so another repair gets a fresh form.
// After saving, onUpdated(updatedRepair) receives the repair returned by the API.
function EditRepairForm({ repair, onUpdated }) {
  const { products, loading, error } = useProducts();

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h2 className="h5 card-title">Edytuj naprawę</h2>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Ładowanie…</span>
            </div>
          </div>
        )}

        {error && (
          <p className="text-danger">
            Nie udało się pobrać listy produktów: {error}
          </p>
        )}

        {!loading && !error && (
          <RepairDataForm
            repair={repair}
            products={products}
            onUpdated={onUpdated}
          />
        )}
      </div>
    </div>
  );
}

export default EditRepairForm;
