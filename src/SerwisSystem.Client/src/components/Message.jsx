function Message({ error, success }) {
  return (
    <>
      {error && <p>Error: {error}</p>}
      {success && <p>{success}</p>}
    </>
  );
}

export default Message;