import { useEffect, useRef, useState } from "react";
import { downloadRepairPdf } from "../api/api";

export default function PrintRepairButton({ repairId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);

  async function download() {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError("");
    try {
      const pdf = await downloadRepairPdf(repairId, controller.signal);
      if (controller.signal.aborted) return;
      if (!(pdf instanceof Blob) || pdf.type !== "application/pdf") {
        throw new Error("Nie udało się pobrać pliku PDF.");
      }
      const url = URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = url;
      link.download = `naprawa-${repairId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      if (error.name !== "AbortError") setError(error.message);
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  return (
    <div onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
      <button type="button" disabled={loading} onClick={download}
        aria-label={`Drukuj naprawę nr ${repairId}`}>
        {loading ? "Przygotowywanie..." : "Drukuj"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
