import { useState } from "react";
import { updateRepair } from "../../api/api";

function EditRepairForm({ repair, onUpdated }) {
  const [status, setStatus] = useState(
    repair.status
  );

  const [selectedProduct, setSelectedProduct] = useState(
    repair.isCustomProduct
      ? "Other"
      : repair.product
  );

  const [customProduct, setCustomProduct] = useState(
    repair.isCustomProduct
      ? repair.product
      : ""
  );

  const [serialNumber, setSerialNumber] = useState(
    repair.serialNumber ?? ""
  );

  const [description, setDescription] = useState(
    repair.description ?? ""
  );

  // Osoba zgłaszająca
  const [reporterName, setReporterName] = useState(
    repair.reporterName ?? ""
  );

  const [reporterSurname, setReporterSurname] = useState(
    repair.reporterSurname ?? ""
  );

  const [reporterPhone, setReporterPhone] = useState(
    repair.reporterPhone ?? ""
  );

  const [reporterEmail, setReporterEmail] = useState(
    repair.reporterEmail ?? ""
  );

  // Firma
  const [companyName, setCompanyName] = useState(
    repair.companyName ?? ""
  );

  const [companyAddress, setCompanyAddress] = useState(
    repair.companyAddress ?? ""
  );

  const [companyPostalCode, setCompanyPostalCode] = useState(
    repair.companyPostalCode ?? ""
  );

  const [companyCity, setCompanyCity] = useState(
    repair.companyCity ?? ""
  );

  const [companyNip, setCompanyNip] = useState(
    repair.companyNip ?? ""
  );

  // Gwarancja
  const [hasWarranty, setHasWarranty] = useState(
    repair.hasWarranty ?? false
  );

  const [purchaseDate, setPurchaseDate] = useState(
    repair.purchaseDate ?? ""
  );

  const [
    purchaseInvoiceNumber,
    setPurchaseInvoiceNumber
  ] = useState(
    repair.purchaseInvoiceNumber ?? ""
  );

  // Umowa
  const [hasContract, setHasContract] = useState(
    repair.hasContract ?? false
  );

  const [contractNumber, setContractNumber] = useState(
    repair.contractNumber ?? ""
  );

  const [repairMethod, setRepairMethod] = useState(repair.repairMethod ?? "Shipping");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updating, setUpdating] = useState(false);

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
  ];// product


  function isValidPhone(phone) {
    const cleaned =
      phone.replace(/[^\d+]/g, "");

    return /^(\+)?\d{7,15}$/.test(cleaned);
  }

  function isValidNip(nip) {
    if (!/^\d{10}$/.test(nip)) {
      return false;
    }

    const weights = [
      6, 5, 7, 2, 3,
      4, 5, 6, 7
    ];

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


  function validateForm() {
    const errors = [];

    if (!reporterName.trim()) {
      errors.push(
        "Imię osoby zgłaszającej jest wymagane."
      );
    }

    if (!reporterSurname.trim()) {
      errors.push(
        "Nazwisko osoby zgłaszającej jest wymagane."
      );
    }

    if (!reporterPhone.trim()) {
      errors.push(
        "Numer telefonu jest wymagany."
      );
    } else if (!isValidPhone(reporterPhone)) {
      errors.push(
        "Numer telefonu jest nieprawidłowy."
      );
    }

    if (!reporterEmail.trim()) {
      errors.push(
        "Adres e-mail jest wymagany."
      );
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      reporterEmail.trim() &&
      !emailRegex.test(
        reporterEmail.trim()
      )
    ) {
      errors.push(
        "Adres e-mail jest nieprawidłowy."
      );
    }

    if (!companyName.trim()) {
      errors.push(
        "Nazwa firmy jest wymagana."
      );
    }

    if (!companyAddress.trim()) {
      errors.push(
        "Adres firmy jest wymagany."
      );
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
      errors.push(
        "Miasto jest wymagane."
      );
    }

    const cleanNip =
      companyNip.replace(/\s/g, "");

    if (!/^\d{10}$/.test(cleanNip)) {
      errors.push(
        "NIP musi składać się dokładnie z 10 cyfr."
      );
    } else if (!isValidNip(cleanNip)) {
      errors.push(
        "Podany NIP jest nieprawidłowy."
      );
    }

    if (!selectedProduct) {
      errors.push(
        "Wybierz produkt."
      );
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
      }
    }

    if (!description.trim()) {
      errors.push(
        "Opis usterki jest wymagany."
      );
    }

    if (hasWarranty) {
      if (!purchaseDate) {
        errors.push(
          "Data zakupu jest wymagana przy naprawie gwarancyjnej."
        );
      }

      if (!purchaseInvoiceNumber.trim()) {
        errors.push(
          "Numer faktury jest wymagany przy naprawie gwarancyjnej."
        );
      }

      if (purchaseDate) {
        const selectedDate =
          new Date(
            `${purchaseDate}T00:00:00`
          );

        const today = new Date();

        today.setHours(
          0,
          0,
          0,
          0
        );

        if (selectedDate > today) {
          errors.push(
            "Data zakupu nie może być datą przyszłą."
          );
        }
      }
    }

    if (
      hasContract &&
      !contractNumber.trim()
    ) {
      errors.push(
        "Numer umowy jest wymagany."
      );
    }

    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (updating) {
      return;
    }

    const validationErrors =
      validateForm();

    if (
      validationErrors.length > 0
    ) {
      setError(
        validationErrors.join(" ")
      );

      setSuccess("");
      return;
    }

    const isCustomProduct =
      selectedProduct === "Other";

    const product =
      isCustomProduct
        ? customProduct.trim()
        : selectedProduct;

    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      await updateRepair(
        repair.id,
        {
          status,
          repairMethod,
          version: repair.version,

          product,
          isCustomProduct,

          serialNumber:
            serialNumber.trim() ||
            null,

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

          companyNip:
            companyNip.replace(
              /\s/g,
              ""
            ),

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
        }
      );

      setError("");

      setSuccess(
        "Dane naprawy zostały zapisane."
      );

      await onUpdated();
    } catch (error) {
      setSuccess("");
      setError(error.message);
    } finally {
      setUpdating(false);
    }
  }

  const serialRequired =
    productRules[selectedProduct] != null;

  return (
    <div>
      <h2>Edytuj naprawę</h2>

      {error && (
        <p role="alert">Błąd: {error}</p>
      )}

      {success && (
        <p>{success}</p>
      )}

      <form className="repair-form" onSubmit={handleSubmit}>
        <h3>Status</h3>

        <select
          value={status}
          onChange={(event) =>
            setStatus(
              event.target.value
            )
          }
        >
          <option value="Pending">
            Oczekująca
          </option>

          <option value="InProgress">
            W trakcie
          </option>

          <option value="Completed">
            Zakończona
          </option>

          <option value="Cancelled">
            Anulowana
          </option>
        </select>

        <h3>Sposób realizacji</h3>
        <div>
          <label htmlFor="repair-method">Sposób realizacji</label>
          <select id="repair-method" value={repairMethod} onChange={event => setRepairMethod(event.target.value)}>
            <option value="Shipping">Wysyłka</option>
            <option value="TechnicianVisit">Naprawa z dojazdem</option>
            <option value="OnSite">Naprawa na miejscu</option>
          </select>
          <small>Zmiana na naprawę z dojazdem lub na miejscu spowoduje wysłanie powiadomienia e-mail po zapisaniu.</small>
        </div>

        <h3>Urządzenie</h3>

        <div>
          <label htmlFor="editrepairform-1">Produkt: </label>

          <select id="editrepairform-1"
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
            <label htmlFor="editrepairform-2">
              Nazwa urządzenia:
            </label>

            <input id="editrepairform-2"
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
          <label htmlFor="editrepairform-3">
            Numer seryjny:
          </label>

          <input id="editrepairform-3"
            required={serialRequired}
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
          <label htmlFor="editrepairform-4">
            Opis usterki:
          </label>

          <textarea id="editrepairform-4"
            required
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
          />
        </div>

        <h3>Dane osoby zgłaszającej</h3>

        <div>
          <label htmlFor="editrepairform-5">Imię: </label>

          <input id="editrepairform-5"
            required
            value={reporterName}
            onChange={(event) =>
              setReporterName(
                event.target.value
              )
            }
          />
        </div>

        <div>
          <label htmlFor="editrepairform-6">Nazwisko: </label>

          <input id="editrepairform-6"
            required
            value={reporterSurname}
            onChange={(event) =>
              setReporterSurname(
                event.target.value
              )
            }
          />
        </div>

        <div>
          <label htmlFor="editrepairform-7">Telefon: </label>

          <input id="editrepairform-7"
            required
            type="tel"
            value={reporterPhone}
            onChange={(event) =>
              setReporterPhone(
                event.target.value
              )
            }
          />
        </div>

        <div>
          <label htmlFor="editrepairform-8">E-mail: </label>

          <input id="editrepairform-8"
            required
            type="email"
            value={reporterEmail}
            onChange={(event) =>
              setReporterEmail(
                event.target.value
              )
            }
          />
        </div>

        <h3>Dane firmy</h3>

        <div>
          <label htmlFor="editrepairform-9">
            Nazwa firmy:
          </label>

          <input id="editrepairform-9"
            required
            value={companyName}
            onChange={(event) =>
              setCompanyName(
                event.target.value
              )
            }
          />
        </div>

        <div>
          <label htmlFor="editrepairform-10">Adres: </label>

          <input id="editrepairform-10"
            required
            value={companyAddress}
            onChange={(event) =>
              setCompanyAddress(
                event.target.value
              )
            }
          />
        </div>

        <div>
          <label htmlFor="editrepairform-11">
            Kod pocztowy:
          </label>

          <input id="editrepairform-11"
            required
            value={companyPostalCode}
            onChange={(event) =>
              setCompanyPostalCode(
                event.target.value
              )
            }
          />
        </div>

        <div>
          <label htmlFor="editrepairform-12">Miasto: </label>

          <input id="editrepairform-12"
            required
            value={companyCity}
            onChange={(event) =>
              setCompanyCity(
                event.target.value
              )
            }
          />
        </div>

        <div>
          <label htmlFor="editrepairform-13">NIP: </label>

          <input id="editrepairform-13"
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

        <h3>Gwarancja</h3>

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
              <label>
                Data zakupu:
              </label>

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
              <label htmlFor="editrepairform-14">
                Numer faktury:
              </label>

              <input id="editrepairform-14"
                required
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

        <h3>Umowa</h3>

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
            <label>
              Numer umowy:
            </label>

            <input
              required
              value={contractNumber}
              onChange={(event) =>
                setContractNumber(
                  event.target.value
                )
              }
            />
          </div>
        )}

        <h3>Zgody</h3>

        <p>
          Zgoda na przetwarzanie danych
          w celu realizacji serwisu:{" "}
          <strong>
            {repair.serviceDataConsent
              ? "Tak"
              : "Nie"}
          </strong>
        </p>

        <p>
          Zgoda marketingowa:{" "}
          <strong>
            {repair.marketingConsent
              ? "Tak"
              : "Nie"}
          </strong>
        </p>

        <small>
          Zgody udzielone przez klienta
          nie mogą być zmieniane przez
          pracowników ani administratorów.
        </small>

        <div>
          <button
            type="submit"
            disabled={updating}
          >
            {updating
              ? "Zapisywanie..."
              : "Zapisz zmiany"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditRepairForm;
