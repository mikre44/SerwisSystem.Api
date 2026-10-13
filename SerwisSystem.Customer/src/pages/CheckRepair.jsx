import { displayLabels } from "../displayLabels";
import { useEffect, useRef, useState } from "react";
import { checkRepair } from "../api/api";

export default function CheckRepair() {
  const [trackingCode, setTrackingCode] = useState("");
  const [email, setEmail] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [repair, setRepair] = useState(null);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const activeSearch = useRef(null);
  useEffect(() => () => activeSearch.current?.abort(), []);

  async function handleSubmit(event) {
    event.preventDefault();
    activeSearch.current?.abort();
    const requestController = new AbortController();
    activeSearch.current = requestController;
    setSearching(true); setError(""); setRepair(null);
    try {
      const result = await checkRepair({ code: trackingCode.trim().toUpperCase(), email: email.trim(), serialNumber: serialNumber.trim() }, requestController.signal);
      if (!requestController.signal.aborted) setRepair(result);
    } catch (error) {
      if (!requestController.signal.aborted) setError(error.message);
    } finally {
      if (activeSearch.current === requestController) { activeSearch.current = null; setSearching(false); }
    }
  }
  return <section className="tracking-card">
    <p className="eyebrow">Twoje zgłoszenie</p>
    <h1>Sprawdź naprawę</h1>
    <p className="page-intro">Wpisz dane ze zgłoszenia, aby sprawdzić aktualny status urządzenia.</p>
    {error && <p role="alert">{error}</p>}
    <form onSubmit={handleSubmit}>
      <label htmlFor="tracking-code">Kod śledzenia</label>
      <input id="tracking-code" required minLength={8} maxLength={8} autoCapitalize="characters" value={trackingCode} onChange={event => setTrackingCode(event.target.value.toUpperCase())} />
      <label htmlFor="lookup-email">E-mail</label>
      <input id="lookup-email" type="email" required value={email} onChange={event => setEmail(event.target.value)} />
      <label htmlFor="lookup-serial">Pierwotny numer seryjny (jeśli podano go w zgłoszeniu)</label>
      <input id="lookup-serial" maxLength={100} value={serialNumber} onChange={event => setSerialNumber(event.target.value)} />
      <button type="submit">{searching ? "Szukaj ponownie" : "Sprawdź naprawę"}</button>
    </form>
    {repair && <section aria-live="polite"><h2>Informacje o naprawie</h2><p>Produkt: {repair.product}</p><p>Status: <span className="status-badge" data-status={repair.status}>{displayLabels[repair.status] ?? "Nieznana wartość"}</span></p><p>Data utworzenia: {new Date(repair.createdAt).toLocaleString("pl-PL")}</p></section>}
  </section>;
}
