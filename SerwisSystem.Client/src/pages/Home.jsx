import { displayLabels } from "../displayLabels";
import { useAuth } from "../context/useAuth";


function Home() {
  const { user } = useAuth();

  return  (
    <div>
      <h1>SerwisSystem</h1>

      <p>Witaj, {user.username}!</p>
      <p>Rola: {displayLabels[user.role] ?? "Nieznana wartość"}</p>

      {user.role !== "Admin" &&
        !Object.values(user.permissions ?? {}).some(Boolean) && (
          <p>
            Twoje konto nie ma jeszcze uprawnień. Administrator musi je nadać.
          </p>
        )}
    </div>
  );
}

export default Home;