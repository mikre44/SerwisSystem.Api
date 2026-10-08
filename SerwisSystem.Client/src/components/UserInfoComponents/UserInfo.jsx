import { displayLabels } from "../../displayLabels";
function UserInfo({ user }) {
  return (
    <div>
      <h2>Informacje o użytkowniku</h2>

      <p>ID: {user.id}</p>
      <p>Nazwa użytkownika: {user.username}</p>
      <p>E-mail: {user.email}</p>
      <p>Rola: {displayLabels[user.role] ?? "Nieznana wartość"}</p>
      <p>Priorytet: {user.priority}</p>
    </div>
  );
}

export default UserInfo;