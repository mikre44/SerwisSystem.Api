import FormField from "../FormField";

function CompanySection({ form, errors, onChange }) {
  return (
    <div className="card mb-3">
      <div className="card-body">
        <h2 className="h5 card-title mb-3">Dane firmy</h2>

        <FormField
          label="Nazwa firmy"
          name="companyName"
          value={form.companyName}
          onChange={onChange}
          error={errors.companyName}
          required
          maxLength={200}
        />

        <FormField
          label="Adres"
          name="companyAddress"
          value={form.companyAddress}
          onChange={onChange}
          error={errors.companyAddress}
          required
          maxLength={200}
        />

        <FormField
          label="Kod pocztowy"
          name="companyPostalCode"
          value={form.companyPostalCode}
          onChange={onChange}
          error={errors.companyPostalCode}
          required
          placeholder="00-000"
          maxLength={6}
        />

        <FormField
          label="Miasto"
          name="companyCity"
          value={form.companyCity}
          onChange={onChange}
          error={errors.companyCity}
          required
          maxLength={100}
        />

        <FormField
          label="NIP"
          name="companyNip"
          value={form.companyNip}
          onChange={onChange}
          error={errors.companyNip}
          required
          inputMode="numeric"
          maxLength={10}
        />
      </div>
    </div>
  );
}

export default CompanySection;
