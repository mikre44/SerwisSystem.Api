import FormField from "../FormField";
import { CUSTOM_PRODUCT_VALUE } from "../../validation/repairForm";

function DeviceSection({
  form,
  errors,
  onChange,
  onProductChange,
  products,
  productsError,
  selectedProductMeta,
}) {
  const isCustomProduct = form.product === CUSTOM_PRODUCT_VALUE;
  const serialRequired = Boolean(selectedProductMeta?.serialRequired);

  return (
    <div className="card mb-3">
      <div className="card-body">
        <h2 className="h5 card-title mb-3">Informacje o urządzeniu</h2>

        {productsError && (
          <div className="alert alert-warning" role="alert">
            Nie udało się pobrać listy produktów: {productsError}
          </div>
        )}

        <div className="mb-3">
          <label htmlFor="product" className="form-label">
            Produkt <span className="text-danger">*</span>
          </label>
          <select
            id="product"
            name="product"
            className={`form-select${errors.product ? " is-invalid" : ""}`}
            value={form.product}
            onChange={onProductChange}
          >
            <option value="">Wybierz produkt</option>
            {products.map((product) => (
              <option key={product.name} value={product.name}>
                {product.name}
              </option>
            ))}
            <option value={CUSTOM_PRODUCT_VALUE}>Inny</option>
          </select>
          {errors.product && <div className="invalid-feedback">{errors.product}</div>}
        </div>

        {isCustomProduct && (
          <FormField
            label="Nazwa urządzenia"
            name="customProductName"
            value={form.customProductName}
            onChange={onChange}
            error={errors.customProductName}
            required
          />
        )}

        <div className="mb-3">
          <label htmlFor="serialNumber" className="form-label">
            Numer seryjny {serialRequired && <span className="text-danger">*</span>}
          </label>
          <input
            id="serialNumber"
            name="serialNumber"
            type="text"
            maxLength={100}
            className={`form-control${errors.serialNumber ? " is-invalid" : ""}`}
            value={form.serialNumber}
            onChange={onChange}
          />
          {selectedProductMeta?.serialHint && (
            <div className="form-text">{selectedProductMeta.serialHint}</div>
          )}
          {isCustomProduct && (
            <div className="form-text">
              Numer seryjny jest opcjonalny dla urządzenia spoza listy.
            </div>
          )}
          {errors.serialNumber && (
            <div className="invalid-feedback">{errors.serialNumber}</div>
          )}
        </div>

        <FormField
          as="textarea"
          label="Opis usterki"
          name="description"
          value={form.description}
          onChange={onChange}
          error={errors.description}
          required
          maxLength={1000}
          rows={4}
        />
      </div>
    </div>
  );
}

export default DeviceSection;
