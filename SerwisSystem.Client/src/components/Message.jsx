function Message({ error, success }) {
  return (
    <>
      {error && <p>Błąd: {error}</p>}
      {success && <p>{success}</p>}
    </>
  );
}

export default Message;