function UserInfo({ user }) {
  return (
    <div>
      <h2>User info</h2>

      <p>ID: {user.id}</p>
      <p>Username: {user.username}</p>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      <p>Priority: {user.priority}</p>
    </div>
  );
}

export default UserInfo;