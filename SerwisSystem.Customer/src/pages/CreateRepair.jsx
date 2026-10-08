import { useState } from "react";
import { createRepair } from "../api/api";

function CreateRepair() {
  // Naprawa
  const [selectedProduct, setSelectedProduct] = useState("");
  const [customProduct, setCustomProduct] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [description, setDescription] = useState("");

  // Osoba zgłaszająca
  const [reporterName, setReporterName] = useState("");
  const [reporterSurname, setReporterSurname] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");

  // Firma
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPostalCode, setCompanyPostalCode] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyNip, setCompanyNip] = useState("");

  // Gwarancja
  const [hasWarranty, setHasWarranty] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchaseInvoiceNumber, setPurchaseInvoiceNumber] = useState("");

  // Umowa
  const [hasContract, setHasContract] = useState(false);
  const [contractNumber, setContractNumber] = useState("");

  // Zgody
  const [serviceDataConsent, setServiceDataConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const [error, setError] = useState("");
  const [createdRepair, setCreatedRepair] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Na razie przykładowa lista.
  // Później podmienimy ją na pełną listę produktów.
  const productRules = {
    "Monitor interaktywny myBoard Titan (Android 15)": {
      checkVersion: "new",
      expectedNumber: "05",
    },

    "Monitor interaktywny myBoard Grey Arrow (Android 13)": {
      checkVersion: "old",
      expectedNumber: "13",
    },

    "Monitor interaktywny myBoard Panda (Android 13)": {
      checkVersion: "new",
      expectedNumber: "02",
    },

    "Monitor interaktywny myBoard Black Arrow (Android 13)": {
      checkVersion: "new",
      expectedNumber: "01",
    },

    "Monitor interaktywny myBoard Grey Rock (Android 11)": {
      checkVersion: "old",
      expectedNumber: "11",
    },

    "Monitor interaktywny myBoard Grey Rock 2.0 (Android 11)": {
      checkVersion: "old",
      expectedNumber: "11",
    },

    "Monitor interaktywny myBoard White Arrow (Android 14)": {
      checkVersion: "new",
      expectedNumber: "04",
    },

    "Monitor interaktywny myBoard Panda 2.0 (Android 14)": {
      checkVersion: "new",
      expectedNumber: "03",
    },

    "Monitor interaktywny (model spoza listy)": {
      checkVersion: "generic",
      expectedNumber: null,
    },

    "Tablica interaktywna myBoard Silver": {
      checkVersion: "generic",
      expectedNumber: null,
    },

    "Tablica interaktywna myBoard Black": {
      checkVersion: "generic",
      expectedNumber: null,
    },
  };

  const products = [
    ...Object.keys(productRules),

    "Akcesoria do tablic interaktywnych myBoard",
    "Akcesoria dla monitorów interaktywnych myBoard",
    "Pracownie językowe",
    "Podłoga interaktywna SmartFloor",
    "Meble",
    "Systemy konferencyjne",
    "Projektory",
    "Laptop",
  ];

  function isValidNip(nip) {
    if (!/^\d{10}$/.test(nip)) {
      return false;
    }

    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];

    const sum = weights.reduce(
      (total, weight, index) =>
        total + Number(nip[index]) * weight,
      0
    );

    const checksum = sum % 11;

    if (checksum === 10) {
      return false;
    }

    return checksum === Number(nip[9]);
  }

  function isValidPhone(phone) {
    const cleaned = phone.replace(/[^\d+]/g, "");

    return /^(\+)?\d{7,15}$/.test(cleaned);
  }


  function validateSerialNumber(serialNumber, product) {
    const serial = serialNumber.trim();
    const rule = productRules[product];

    // Products such as laptop, projector, furniture etc.
    // do not require serial validation.
    if (!rule) {
      return {
        valid: true,
      };
    }

    // New serial format
    if (rule.checkVersion === "new") {
      const match = serial.match(
        /^L(\d{6})(\d{2})(55|65|75|86|98)(\d{5})$/
      );

      if (!match) {
        return {
          valid: false,
          message:
            "Numer seryjny ma nieprawidłowy format dla wybranego monitora.",
        };
      }

      const modelNumber = match[2];

      if (modelNumber !== rule.expectedNumber) {
        return {
          valid: false,
          message:
            "Numer seryjny nie odpowiada wybranemu modelowi monitora.",
        };
      }

      return {
        valid: true,
      };
    }

    // Old serial format
    if (rule.checkVersion === "old") {
      const match = serial.match(
        /^(\d{4})(8|11|13)\d(55|65|75|86|98)(\d{3})z$/i
      );

      if (!match) {
        return {
          valid: false,
          message:
            "Numer seryjny ma nieprawidłowy format dla wybranego monitora.",
        };
      }

      const androidVersion = match[2];

      if (androidVersion !== rule.expectedNumber) {
        return {
          valid: false,
          message:
            `Numer seryjny wskazuje Android ${androidVersion}, ` +
            `a wybrany monitor ma Android ${rule.expectedNumber}.`,
        };
      }

      return {
        valid: true,
      };
    }

    // Interactive boards + monitor outside the known model list
    if (rule.checkVersion === "generic") {
      if (!/^[A-Za-z0-9._/-]{4,40}$/.test(serial)) {
        return {
          valid: false,
          message:
            "Numer seryjny musi mieć od 4 do 40 dozwolonych znaków.",
        };
      }

      return {
        valid: true,
      };
    }

    return {
      valid: false,
      message:
        "Nie można zweryfikować numeru seryjnego.",
    };
  }


  function validateForm() {
    const errors = [];

    // Osoba zgłaszająca
    if (!reporterName.trim()) {
      errors.push("Imię osoby zgłaszającej jest wymagane.");
    }

    if (!reporterSurname.trim()) {
      errors.push("Nazwisko osoby zgłaszającej jest wymagane.");
    }

    if (!reporterPhone.trim()) {
      errors.push("Numer telefonu jest wymagany.");
    } else if (!isValidPhone(reporterPhone)) {
      errors.push("Numer telefonu jest nieprawidłowy.");
    }

    if (!reporterEmail.trim()) {
      errors.push("Adres e-mail jest wymagany.");
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      reporterEmail.trim() &&
      !emailRegex.test(reporterEmail.trim())
    ) {
      errors.push("Adres e-mail jest nieprawidłowy.");
    }

    if (
      reporterEmail.trim() !== confirmEmail.trim()
    ) {
      errors.push("Adresy e-mail nie są takie same.");
    }

    // Firma
    if (!companyName.trim()) {
      errors.push("Nazwa firmy jest wymagana.");
    }

    if (!companyAddress.trim()) {
      errors.push("Adres firmy jest wymagany.");
    }

    const postalCodeRegex =
      /^\d{2}-\d{3}$/;

    if (
      !postalCodeRegex.test(
        companyPostalCode.trim()
      )
    ) {
      errors.push(
        "Kod pocztowy musi mieć format XX-XXX."
      );
    }

    if (!companyCity.trim()) {
      errors.push("Miasto jest wymagane.");
    }

    if (!/^\d{10}$/.test(companyNip)) {
      errors.push(
        "NIP musi składać się dokładnie z 10 cyfr."
      );
    } else if (!isValidNip(companyNip)) {
      errors.push("Podany NIP jest nieprawidłowy.");
    }

    // Produkt
    if (!selectedProduct) {
      errors.push("Wybierz produkt.");
    }

    if (
      selectedProduct === "Other" &&
      !customProduct.trim()
    ) {
      errors.push(
        "Podaj nazwę urządzenia niewystępującego na liście."
      );
    }

    const serialRule = productRules[selectedProduct];

    if (serialRule) {
      if (!serialNumber.trim()) {
        errors.push(
          "Numer seryjny jest wymagany dla wybranego produktu."
        );
      } else {
        const serialValidation =
          validateSerialNumber(
            serialNumber,
            selectedProduct
          );

        if (!serialValidation.valid) {
          errors.push(
            serialValidation.message
          );
        }
      }
    }

    if (!description.trim()) {
      errors.push("Opis usterki jest wymagany.");
    }

    // Gwarancja
    if (hasWarranty) {
      if (!purchaseDate) {
        errors.push(
          "Data zakupu jest wymagana przy naprawie gwarancyjnej."
        );
      }

      if (!purchaseInvoiceNumber.trim()) {
        errors.push(
          "Numer faktury zakupu jest wymagany przy naprawie gwarancyjnej."
        );
      }

      if (purchaseDate) {
        const selectedDate = new Date(
          `${purchaseDate}T00:00:00`
        );

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        if (selectedDate > today) {
          errors.push(
            "Data zakupu nie może być datą przyszłą."
          );
        }
      }
    }

    // Umowa
    if (
      hasContract &&
      !contractNumber.trim()
    ) {
      errors.push(
        "Numer umowy jest wymagany po zaznaczeniu opcji umowy."
      );
    }

    // Zgoda
    if (!serviceDataConsent) {
      errors.push(
        "Zgoda na przetwarzanie danych w celu realizacji serwisu jest wymagana."
      );
    }

    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const validationErrors = validateForm();

    if (validationErrors.length > 0) {
      setError(validationErrors.join(" "));
      setCreatedRepair(null);
      return;
    }

    const isCustomProduct =
      selectedProduct === "Other";

    const product =
      isCustomProduct
        ? customProduct.trim()
        : selectedProduct;

    try {
      setSubmitting(true);
      setError("");

      const repair = await createRepair({
        product,
        isCustomProduct,

        serialNumber:
          serialNumber.trim() || null,

        description:
          description.trim(),

        reporterName:
          reporterName.trim(),

        reporterSurname:
          reporterSurname.trim(),

        reporterPhone:
          reporterPhone.replace(
            /[^\d+]/g,
            ""
          ),

        reporterEmail:
          reporterEmail.trim(),

        companyName:
          companyName.trim(),

        companyAddress:
          companyAddress.trim(),

        companyPostalCode:
          companyPostalCode.trim(),

        companyCity:
          companyCity.trim(),

        companyNip,

        hasWarranty,

        purchaseDate:
          hasWarranty
            ? purchaseDate
            : null,

        purchaseInvoiceNumber:
          hasWarranty
            ? purchaseInvoiceNumber.trim()
            : null,

        hasContract,

        contractNumber:
          hasContract
            ? contractNumber.trim()
            : null,

        serviceDataConsent,
        marketingConsent,
      });

      setCreatedRepair(repair);
      setError("");
    } catch (error) {
      setCreatedRepair(null);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  const serialRequired =
    productRules[selectedProduct] != null;

  return (
    <div>
      <h1>Zgłoszenie naprawy</h1>

      {error && (
        <p>
          Błąd: {error}
        </p>
      )}

      {createdRepair && (
        <div>
          <h2>
            Zgłoszenie zostało wysłane
          </h2>

          <p>
            Kod śledzenia: <strong>{createdRepair.trackingCode}</strong>
          </p>

          <p>
            Produkt: {createdRepair.product}
          </p>

          {createdRepair.serialNumber && (
            <p>
              Numer seryjny:{" "}
              {createdRepair.serialNumber}
            </p>
          )}
        </div>
      )}

      {!createdRepair && <form onSubmit={handleSubmit}>
        <h2>Dane osoby zgłaszającej</h2>

        <div>
          <label htmlFor="createrepair-1">Imię: </label>

          <input id="createrepair-1"
            required
            maxLength={100}
            value={reporterName}
            onChange={(event) =>
              setReporterName(event.target.value)
            }
          />
        </div>

        <div>
          <label htmlFor="createrepair-2">Nazwisko: </label>

          <input id="createrepair-2"
            required
            maxLength={100}
            value={reporterSurname}
            onChange={(event) =>
              setReporterSurname(event.target.value)
            }
          />
        </div>

        <div>
          <label htmlFor="createrepair-3">Telefon kontaktowy: </label>

          <input id="createrepair-3"
            required
            type="tel"
            value={reporterPhone}
            onChange={(event) =>
              setReporterPhone(event.target.value)
            }
          />
        </div>

        <div>
          <label htmlFor="createrepair-4">E-mail: </label>

          <input id="createrepair-4"
            required
            type="email"
            value={reporterEmail}
            onChange={(event) =>
              setReporterEmail(event.target.value)
            }
          />
        </div>

        <div>
          <label htmlFor="createrepair-5">Powtórz e-mail: </label>

          <input id="createrepair-5"
            required
            type="email"
            value={confirmEmail}
            onChange={(event) =>
              setConfirmEmail(event.target.value)
            }
          />
        </div>

        <h2>Dane firmy</h2>

        <div>
          <label htmlFor="createrepair-6">Nazwa firmy: </label>

          <input id="createrepair-6"
            required
            maxLength={200}
            value={companyName}
            onChange={(event) =>
              setCompanyName(event.target.value)
            }
          />
        </div>

        <div>
          <label htmlFor="createrepair-7">Adres: </label>

          <input id="createrepair-7"
            required
            maxLength={200}
            value={companyAddress}
            onChange={(event) =>
              setCompanyAddress(event.target.value)
            }
          />
        </div>

        <div>
          <label htmlFor="createrepair-8">Kod pocztowy: </label>

          <input id="createrepair-8"
            required
            placeholder="00-000"
            maxLength={6}
            value={companyPostalCode}
            onChange={(event) => {
              const value =
                event.target.value
                  .replace(/[^\d-]/g, "")
                  .slice(0, 6);

              setCompanyPostalCode(value);
            }}
          />
        </div>

        <div>
          <label htmlFor="createrepair-9">Miasto: </label>

          <input id="createrepair-9"
            required
            maxLength={100}
            value={companyCity}
            onChange={(event) =>
              setCompanyCity(event.target.value)
            }
          />
        </div>

        <div>
          <label htmlFor="createrepair-10">NIP: </label>

          <input id="createrepair-10"
            required
            inputMode="numeric"
            maxLength={10}
            value={companyNip}
            onChange={(event) => {
              const value =
                event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 10);

              setCompanyNip(value);
            }}
          />
        </div>

        <h2>Informacje o urządzeniu</h2>

        <div>
          <label htmlFor="createrepair-11">Produkt: </label>

          <select id="createrepair-11"
            required
            value={selectedProduct}
            onChange={(event) => {
              setSelectedProduct(
                event.target.value
              );

              setSerialNumber("");
            }}
          >
            <option value="">
              Wybierz produkt
            </option>

            {products.map((product) => (
              <option
                key={product}
                value={product}
              >
                {product}
              </option>
            ))}

            <option value="Other">
              Inny
            </option>
          </select>
        </div>

        {selectedProduct === "Other" && (
          <div>
            <label htmlFor="createrepair-12">
              Nazwa urządzenia:
            </label>

            <input id="createrepair-12"
              required
              value={customProduct}
              onChange={(event) =>
                setCustomProduct(
                  event.target.value
                )
              }
            />
          </div>
        )}

        <div>
          <label htmlFor="createrepair-13">Numer seryjny: </label>

          <input id="createrepair-13"
            required={serialRequired}
            maxLength={100}
            value={serialNumber}
            onChange={(event) =>
              setSerialNumber(
                event.target.value
              )
            }
          />

          {selectedProduct === "Other" && (
            <small>
              Numer seryjny jest opcjonalny
              dla urządzenia spoza listy.
            </small>
          )}
        </div>

        <div>
          <label htmlFor="createrepair-14">Opis usterki: </label>

          <textarea id="createrepair-14"
            required
            maxLength={1000}
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
          />
        </div>

        <h2>Gwarancja</h2>

        <label>
          <input
            type="checkbox"
            checked={hasWarranty}
            onChange={(event) =>
              setHasWarranty(
                event.target.checked
              )
            }
          />

          Naprawa gwarancyjna
        </label>

        {hasWarranty && (
          <>
            <div>
              <label>Data zakupu: </label>

              <input
                required
                type="date"
                value={purchaseDate}
                onChange={(event) =>
                  setPurchaseDate(
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <label htmlFor="createrepair-15">
                Numer faktury zakupu:
              </label>

              <input id="createrepair-15"
                required
                maxLength={100}
                value={
                  purchaseInvoiceNumber
                }
                onChange={(event) =>
                  setPurchaseInvoiceNumber(
                    event.target.value
                  )
                }
              />
            </div>
          </>
        )}

        <h2>Umowa</h2>

        <label>
          <input
            type="checkbox"
            checked={hasContract}
            onChange={(event) =>
              setHasContract(
                event.target.checked
              )
            }
          />

          Zgłoszenie w ramach umowy
        </label>

        {hasContract && (
          <div>
            <label>Numer umowy: </label>

            <input
              required
              maxLength={100}
              value={contractNumber}
              onChange={(event) =>
                setContractNumber(
                  event.target.value
                )
              }
            />
          </div>
        )}

        <h2>Zgody</h2>

        <label>
          <input
            required
            type="checkbox"
            checked={serviceDataConsent}
            onChange={(event) =>
              setServiceDataConsent(
                event.target.checked
              )
            }
          />

          Przekazuję swoje dane osobowe
          w celu realizacji świadczeń
          serwisowych.
        </label>

        <br />

        <label>
          <input
            type="checkbox"
            checked={marketingConsent}
            onChange={(event) =>
              setMarketingConsent(
                event.target.checked
              )
            }
          />

          Chcę otrzymywać informacje
          o nowościach drogą e-mailową.
        </label>

        <div>
          <button
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Wysyłanie..."
              : "Wyślij zgłoszenie"}
          </button>
        </div>
      </form>}
      {createdRepair && <button onClick={() => setCreatedRepair(null)}>Zgłoś kolejne urządzenie</button>}
    </div>
  );
}

export default CreateRepair;