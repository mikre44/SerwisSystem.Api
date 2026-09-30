import FormField from "../FormField";

function ReporterSection({ form, errors, onChange }) {
  return (
    <div className="card mb-3">
      <div className="card-body">
        <h2 className="h5 card-title mb-3">Dane osoby zgłaszającej</h2>

        <FormField
          label="Imię"
          name="reporterName"
          value={form.reporterName}
          onChange={onChange}
          error={errors.reporterName}
          required
          maxLength={100}
        />

        <FormField
          label="Nazwisko"
          name="reporterSurname"
          value={form.reporterSurname}
          onChange={onChange}
          error={errors.reporterSurname}
          required
          maxLength={100}
        />

        <FormField
          label="Telefon kontaktowy"
          name="reporterPhone"
          type="tel"
          value={form.reporterPhone}
          onChange={onChange}
          error={errors.reporterPhone}
          required
        />

        <FormField
          label="E-mail"
          name="reporterEmail"
          type="email"
          value={form.reporterEmail}
          onChange={onChange}
          error={errors.reporterEmail}
          required
        />

        <FormField
          label="Powtórz e-mail"
          name="confirmEmail"
          type="email"
          value={form.confirmEmail}
          onChange={onChange}
          error={errors.confirmEmail}
          required
        />
      </div>
    </div>
  );
}

export default ReporterSection;
