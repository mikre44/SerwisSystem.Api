import FormField from "../FormField";
import FormCheck from "../FormCheck";

function WarrantyContractSection({ form, errors, onChange }) {
  return (
    <div className="card mb-3">
      <div className="card-body">
        <h2 className="h5 card-title mb-3">Gwarancja i umowa</h2>

        <FormCheck
          label="Naprawa gwarancyjna"
          name="hasWarranty"
          checked={form.hasWarranty}
          onChange={onChange}
        />

        {form.hasWarranty && (
          <div className="row mt-2">
            <div className="col-sm-6">
              <FormField
                label="Data zakupu"
                name="purchaseDate"
                type="date"
                value={form.purchaseDate}
                onChange={onChange}
                error={errors.purchaseDate}
                required
              />
            </div>
            <div className="col-sm-6">
              <FormField
                label="Numer faktury zakupu"
                name="purchaseInvoiceNumber"
                value={form.purchaseInvoiceNumber}
                onChange={onChange}
                error={errors.purchaseInvoiceNumber}
                required
                maxLength={100}
              />
            </div>
          </div>
        )}

        <FormCheck
          label="Zgłoszenie w ramach umowy"
          name="hasContract"
          checked={form.hasContract}
          onChange={onChange}
          className="mt-3"
        />

        {form.hasContract && (
          <div className="mt-2">
            <FormField
              label="Numer umowy"
              name="contractNumber"
              value={form.contractNumber}
              onChange={onChange}
              error={errors.contractNumber}
              required
              maxLength={100}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default WarrantyContractSection;
