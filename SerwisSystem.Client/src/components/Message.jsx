function Message({ error, success }) {
  return (
    <>
      {error && <p role="alert">Błąd: {error}</p>}
      {success && <p className="message-success" role="status">{success}</p>}
    </>
  );
}

export default Message;