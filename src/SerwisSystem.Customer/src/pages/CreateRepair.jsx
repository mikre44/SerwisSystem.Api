import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createRepair, getProducts } from "../api/api";
import { CUSTOM_PRODUCT_VALUE, validateRepairForm } from "../validation/repairForm";
import ReporterSection from "../components/CreateRepairSections/ReporterSection";
import CompanySection from "../components/CreateRepairSections/CompanySection";
import DeviceSection from "../components/CreateRepairSections/DeviceSection";
import WarrantyContractSection from "../components/CreateRepairSections/WarrantyContractSection";
import ConsentsSection from "../components/CreateRepairSections/ConsentsSection";

const initialForm = {
  reporterName: "",
  reporterSurname: "",
  reporterPhone: "",
  reporterEmail: "",
  confirmEmail: "",

  companyName: "",
  companyAddress: "",
  companyPostalCode: "",
  companyCity: "",
  companyNip: "",

  product: "",
  customProductName: "",
  serialNumber: "",
  description: "",

  hasWarranty: false,
  purchaseDate: "",
  purchaseInvoiceNumber: "",

  hasContract: false,
  contractNumber: "",

  serviceDataConsent: false,
  marketingConsent: false,
};

function CreateRepair() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [createdRepair, setCreatedRepair] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [products, setProducts] = useState([]);
  const [productsError, setProductsError] = useState("");

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((error) => setProductsError(error.message));
  }, []);

  const selectedProductMeta = products.find((p) => p.name === form.product);

  function handleFieldChange(event) {
    const { name, value, type, checked } = event.target;

    // A few fields are typed as free text but must only ever hold digits
    // (and a dash for the postal code), so we mask them while typing.
    if (name === "companyPostalCode") {
      setForm((prev) => ({
        ...prev,
        companyPostalCode: value.replace(/[^\d-]/g, "").slice(0, 6),
      }));
      return;
    }

    if (name === "companyNip") {
      setForm((prev) => ({
        ...prev,
        companyNip: value.replace(/\D/g, "").slice(0, 10),
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleProductChange(event) {
    const product = event.target.value;

    setForm((prev) => ({
      ...prev,
      product,
      serialNumber: "",
      customProductName: product === CUSTOM_PRODUCT_VALUE ? prev.customProductName : "",
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const validationErrors = validateRepairForm(form, selectedProductMeta);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setSubmitError("");
      setCreatedRepair(null);
      return;
    }

    const isCustomProduct = form.product === CUSTOM_PRODUCT_VALUE;
    const product = isCustomProduct ? form.customProductName.trim() : form.product;

    try {
      setSubmitting(true);
      setSubmitError("");

      const repair = await createRepair({
        product,
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
        companyNip: form.companyNip,

        hasWarranty: form.hasWarranty,
        purchaseDate: form.hasWarranty ? form.purchaseDate : null,
        purchaseInvoiceNumber: form.hasWarranty
          ? form.purchaseInvoiceNumber.trim()
          : null,

        hasContract: form.hasContract,
        contractNumber: form.hasContract ? form.contractNumber.trim() : null,

        serviceDataConsent: form.serviceDataConsent,
        marketingConsent: form.marketingConsent,
      });

      // Reset the form so a second click cannot create a duplicate repair,
      // and keep the created id on screen -- it is the customer's only way
      // to check the status later.
      setCreatedRepair(repair);
      setForm(initialForm);
      setErrors({});

      // The submit button is at the bottom of a long form; bring the
      // confirmation with the repair number into view.
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setCreatedRepair(null);
      setSubmitError(error.message);
      setErrors(error.fieldErrors || {});
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container py-4" style={{ maxWidth: "720px" }}>
      <h1 className="mb-4">Zgłoszenie naprawy</h1>

      {createdRepair && (
        <div className="alert alert-success" role="alert">
          <h2 className="h5">Zgłoszenie zostało przyjęte</h2>
          <p className="mb-1">
            Numer zgłoszenia: <strong>{createdRepair.id}</strong>
          </p>
          <p className="mb-0">
            Zapisz ten numer — będzie potrzebny, aby{" "}
            <Link to="/check">sprawdzić status naprawy</Link>.
          </p>
        </div>
      )}

      {submitError && (
        <div className="alert alert-danger" role="alert">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <ReporterSection form={form} errors={errors} onChange={handleFieldChange} />
        <CompanySection form={form} errors={errors} onChange={handleFieldChange} />
        <DeviceSection
          form={form}
          errors={errors}
          onChange={handleFieldChange}
          onProductChange={handleProductChange}
          products={products}
          productsError={productsError}
          selectedProductMeta={selectedProductMeta}
        />
        <WarrantyContractSection form={form} errors={errors} onChange={handleFieldChange} />
        <ConsentsSection form={form} errors={errors} onChange={handleFieldChange} />

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting && (
            <span
              className="spinner-border spinner-border-sm me-2"
              aria-hidden="true"
            />
          )}
          {submitting ? "Wysyłanie..." : "Wyślij zgłoszenie"}
        </button>
      </form>
    </div>
  );
}

export default CreateRepair;
