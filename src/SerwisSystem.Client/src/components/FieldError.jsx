// Validation messages for one form field. `messages` is an array of strings,
// the same shape as the `errors` object of an API validation response.
function FieldError({ messages }) {
  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <div className="invalid-feedback d-block" role="alert">
      {messages.join(" ")}
    </div>
  );
}

export default FieldError;
