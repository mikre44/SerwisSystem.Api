// `info` is for neutral notes, e.g. a form that was submitted without changes.
function Message({ error, success, info }) {
  return (
    <>
      {info && (
        <div className="alert alert-info d-flex align-items-center gap-2" role="status">
          <i className="bi bi-info-circle" aria-hidden="true" />
          <span>{info}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-triangle" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-check-circle" aria-hidden="true" />
          <span>{success}</span>
        </div>
      )}
    </>
  );
}

export default Message;
