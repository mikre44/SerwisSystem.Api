// A labeled Bootstrap checkbox, matching the layout of FormField.
function FormCheck({ label, name, checked, onChange, error, className = "" }) {
  const controlId = `field-${name}`;

  return (
    <div className={`form-check ${className}`.trim()}>
      <input
        id={controlId}
        name={name}
        type="checkbox"
        className={`form-check-input${error ? " is-invalid" : ""}`}
        checked={checked}
        onChange={onChange}
      />
      <label htmlFor={controlId} className="form-check-label">
        {label}
      </label>
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}

export default FormCheck;
