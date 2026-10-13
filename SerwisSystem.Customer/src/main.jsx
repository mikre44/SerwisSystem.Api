import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

document.addEventListener("invalid", event => {
  const field = event.target;
  if (typeof field.setCustomValidity !== "function") return;
  field.setCustomValidity("");
  const validity = field.validity;
  field.setCustomValidity(
    validity.valueMissing ? "Uzupełnij to pole."
    : validity.typeMismatch ? "Wprowadź wartość w poprawnym formacie."
    : validity.tooShort ? `Wprowadź co najmniej ${field.minLength} znaków.`
    : validity.tooLong ? `Wprowadź nie więcej niż ${field.maxLength} znaków.`
    : validity.rangeUnderflow ? `Minimalna wartość to ${field.min}.`
    : validity.rangeOverflow ? `Maksymalna wartość to ${field.max}.`
    : "Wprowadź prawidłową wartość."
  );
}, true);
document.addEventListener("input", event => event.target.setCustomValidity?.(""));
document.addEventListener("change", event => event.target.setCustomValidity?.(""));

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);