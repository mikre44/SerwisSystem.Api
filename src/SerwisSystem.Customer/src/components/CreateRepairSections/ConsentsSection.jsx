import FormCheck from "../FormCheck";

function ConsentsSection({ form, errors, onChange }) {
  return (
    <div className="card mb-3">
      <div className="card-body">
        <h2 className="h5 card-title mb-3">Zgody</h2>

        <FormCheck
          label="Przekazuję swoje dane osobowe w celu realizacji świadczeń serwisowych."
          name="serviceDataConsent"
          checked={form.serviceDataConsent}
          onChange={onChange}
          error={errors.serviceDataConsent}
        />

        <FormCheck
          label="Chcę otrzymywać informacje o nowościach drogą e-mailową."
          name="marketingConsent"
          checked={form.marketingConsent}
          onChange={onChange}
          className="mt-2"
        />
      </div>
    </div>
  );
}

export default ConsentsSection;
