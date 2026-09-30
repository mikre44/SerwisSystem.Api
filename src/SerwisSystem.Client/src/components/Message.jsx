function Message({ error, success }) {
  return (
    <>
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
