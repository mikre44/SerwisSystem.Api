// A labeled Bootstrap input/textarea with a validation message. Used by
// every CreateRepair section so each one only lists its fields, not markup.
function FormField({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  as = "input",
  required = false,
  ...rest
}) {
  const controlId = `field-${name}`;
  const className = `form-control${error ? " is-invalid" : ""}`;

  return (
    <div className="mb-3">
      <label htmlFor={controlId} className="form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>

      {as === "textarea" ? (
        <textarea
          id={controlId}
          name={name}
          className={className}
          value={value}
          onChange={onChange}
          {...rest}
        />
      ) : (
        <input
          id={controlId}
          name={name}
          type={type}
          className={className}
          value={value}
          onChange={onChange}
          {...rest}
        />
      )}

      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}

export default FormField;
