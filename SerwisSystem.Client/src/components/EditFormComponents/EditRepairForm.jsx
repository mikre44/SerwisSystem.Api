import { useState } from "react";
import { updateRepair } from "../../api/api";

function EditRepairForm({ repair, onUpdated }) {
  const [status, setStatus] = useState(repair.status);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [customProduct, setCustomProduct] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [description, setDescription] = useState(repair.description);

  const [reporterName, setReporterName] = useState(repair.reporterName);
  const [reporterSurname, setReporterSurname] = useState(repair.reporterSurname);
  const [reporterPhone, setReporterPhone] = useState(repair.reporterPhone);
  const [reporterEmail, setReporterEmail] = useState(repair.reporterEmail);

  const [companyName, setCompanyName] = useState(repair.companyName);
  const [companyAddress, setCompanyAddress] = useState(repair.companyAddress);
  const [companyPostalCode, setCompanyPostalCode] = useState(repair.companyPostalCode);
  const [companyCity, setCompanyCity] = useState(repair.companyCity);
  const [companyNip, setCompanyNip] = useState(repair.companyNip);

  const [hasWarranty, setHasWarranty] = useState(repair.hasWarranty);
  const [purchaseDate, setPurchaseDate] = useState();
  const [purchaseInvoiceNumber, setPurchaseInvoiceNumber] = useState();

  const [hasContract, setHasContract] = useState(repair.hasContract);
  const [contractNumber, setContractNumber] = useState();

  const [serviceDataConsent, setServiceDataConsent] = useState();

  const [marketingConsent, setMarketingConsent] = useState();

  const products = [
    "myBoard Grey Arrow",
    "Another device",
    "Another monitor",
  ];
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  
  function isValidPhone(phone) {
    const cleaned = phone.replace(/[^\d+]/g, "");

    return /^(\+)?\d{7,15}$/.test(cleaned);
  }

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




  function validateForm() {
    const errors = [];

    // Reporter
    if (!reporterName.trim()) {
      errors.push("Reporter name is required.");
    }

    if (!reporterSurname.trim()) {
      errors.push("Reporter surname is required.");
    }

    if (!reporterPhone.trim()) {
      errors.push("Reporter phone number is required.");
    } else if (!isValidPhone(reporterPhone)) {
      errors.push("Reporter phone number is invalid.");
    }

    if (!reporterEmail.trim()) {
      errors.push("Reporter email is required.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      reporterEmail.trim() &&
      !emailRegex.test(reporterEmail.trim())
    ) {
      errors.push("Reporter email is invalid.");
    }


    // Company
    if (!companyName.trim()) {
      errors.push("Company name is required.");
    }

    if (!companyAddress.trim()) {
      errors.push("Company address is required.");
    }

    const postalCodeRegex = /^\d{2}-\d{3}$/;

    if (!postalCodeRegex.test(companyPostalCode.trim())) {
      errors.push(
        "Postal code must have format XX-XXX."
      );
    }

    if (!companyCity.trim()) {
      errors.push("Company city is required.");
    }

    // NIP
    const cleanNip = companyNip.replace(/\s/g, "");

    if (!/^\d{10}$/.test(cleanNip)) {
      errors.push(
        "NIP must contain exactly 10 digits."
      );
    } else if (!isValidNip(cleanNip)) {
      errors.push("NIP is invalid.");
    }


    // Repair
    if (!selectedProduct) {
      errors.push("Product is required.");
    }

    if (
      selectedProduct === "Other" &&
      !customProduct.trim()
    ) {
      errors.push(
        "Device name is required when Other is selected."
      );
    }

    if (selectedProduct !== "Other" && !serialNumber.trim()) 
      {
      errors.push(
        "Serial number is required for monitors and interactive boards."
      );
    }

    if (!description.trim()) {
      errors.push(
        "Fault description is required."
      );
    }


    // Warranty
    if (hasWarranty) {
      if (!purchaseDate) {
        errors.push(
          "Purchase date is required for warranty repairs."
        );
      }

      if (!purchaseInvoiceNumber.trim()) {
        errors.push(
          "Purchase invoice number is required for warranty repairs."
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
            "Purchase date cannot be in the future."
          );
        }
      }
    }


    // Contract
    if (
      hasContract &&
      !contractNumber.trim()
    ) {
      errors.push(
        "Contract number is required when contract is selected."
      );
    }


    // Consent
    if (!serviceDataConsent) {
      errors.push(
        "Service data consent is required."
      );
    }

    return errors;
  }


  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateForm();

    if (validationErrors.length > 0) {
      setError(validationErrors.join(" "));
      setSuccess("");
      return;
    }

    const isCustomProduct =
      selectedProduct === "Other";

    const product = isCustomProduct
      ? customProduct.trim()
      : selectedProduct;

    try {
      await updateRepair(repair.id, {
        status,

        product,
        isCustomProduct,
        serialNumber: serialNumber.trim(),
        description: description.trim(),

        reporterName: reporterName.trim(),
        reporterSurname: reporterSurname.trim(),
        reporterPhone: reporterPhone.replace(/[^\d+]/g, ""),
        reporterEmail: reporterEmail.trim(),

        companyName: companyName.trim(),
        companyAddress: companyAddress.trim(),
        companyPostalCode: companyPostalCode.trim(),
        companyCity: companyCity.trim(),
        companyNip: companyNip.replace(/\s/g, ""),

        hasWarranty,
        purchaseDate: hasWarranty ? purchaseDate : null,
        purchaseInvoiceNumber:  hasWarranty ? purchaseInvoiceNumber.trim() : null,

        hasContract,
        contractNumber: hasContract ? contractNumber.trim() : null,

        serviceDataConsent,
        marketingConsent,
      });

      setError("");
      setSuccess(
        "Repair updated successfully."
      );

      await onUpdated();
    } catch (error) {
      setSuccess("");
      setError(error.message);
    }
  }

  return (
    <div>
      <h2>Edit repair</h2>

      {error && <p>Error: {error}</p>}
      {success && <p>{success}</p>}

      <form onSubmit={handleSubmit}>

        <h2>Status: </h2>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}>
          <option value="Pending">Pending</option>
          <option value="InProgress">InProgress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>


        <h3>Repair</h3>

        <div>
          <label>Product category: </label>

          <select
            required
            value={selectedProduct}
            onChange={(event) =>
              setSelectedProduct(event.target.value)
            }
          >
            <option value="">
              Select product
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
              Other
            </option>
          </select>
        </div>

        {selectedProduct === "Other" && (
          <div>
            <label>Device name: </label>

            <input
              required
              value={customProduct}
              onChange={(event) =>
                setCustomProduct(event.target.value)
              }
            />
          </div>
        )}

        <div>
          <label>Serial number: </label>

          <input
            required={
              selectedProduct === "Other"
            }
            value={serialNumber}
            onChange={(event) =>
              setSerialNumber(event.target.value)
            }
          />
        </div>

        <div>
          <label>Description: </label>

          <textarea
            required
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
          />
        </div>


        <h3>Reporting person</h3>

        <div>
          <label>Name: </label>

          <input
            required
            value={reporterName}
            onChange={(event) =>
              setReporterName(event.target.value)
            }
          />
        </div>

        <div>
          <label>Surname: </label>

          <input
            required
            value={reporterSurname}
            onChange={(event) =>
              setReporterSurname(event.target.value)
            }
          />
        </div>

        <div>
          <label>Phone: </label>

          <input
            required
            value={reporterPhone}
            onChange={(event) =>
              setReporterPhone(event.target.value)
            }
          />
        </div>

        <div>
          <label>Email: </label>

          <input
            required
            type="email"
            value={reporterEmail}
            onChange={(event) =>
              setReporterEmail(event.target.value)
            }
          />
        </div>


        <h3>Company</h3>

        <div>
          <label>Company name: </label>

          <input
            required
            value={companyName}
            onChange={(event) =>
              setCompanyName(event.target.value)
            }
          />
        </div>

        <div>
          <label>Address: </label>

          <input
            required
            value={companyAddress}
            onChange={(event) =>
              setCompanyAddress(event.target.value)
            }
          />
        </div>

        <div>
          <label>Postal code: </label>

          <input
            required
            value={companyPostalCode}
            onChange={(event) =>
              setCompanyPostalCode(event.target.value)
            }
          />
        </div>

        <div>
          <label>City: </label>

          <input
            required
            value={companyCity}
            onChange={(event) =>
              setCompanyCity(event.target.value)
            }
          />
        </div>

        <div>
          <label>NIP: </label>

          <input
            required
            value={companyNip}
            onChange={(event) =>
              setCompanyNip(event.target.value)
            }
          />
        </div>

        <h3>Warranty</h3>

        <label>
          <input
            type="checkbox"
            checked={hasWarranty}
            onChange={(event) =>
              setHasWarranty(event.target.checked)
            }
          />

          Warranty repair
        </label>

        {hasWarranty && (
          <>
            <div>
              <label>Purchase date: </label>

              <input
                required
                type="date"
                value={purchaseDate}
                onChange={(event) =>
                  setPurchaseDate(event.target.value)
                }
              />
            </div>

            <div>
              <label>Invoice number: </label>

              <input
                required
                value={purchaseInvoiceNumber}
                onChange={(event) =>
                  setPurchaseInvoiceNumber(event.target.value)
                }
              />
            </div>
          </>
        )}


        <h3>Contract</h3>

        <label>
          <input
            type="checkbox"
            checked={hasContract}
            onChange={(event) =>
              setHasContract(event.target.checked)
            }
          />

          Has contract
        </label>

        {hasContract && (
          <div>
            <label>Contract number: </label>

            <input
              required
              value={contractNumber}
              onChange={(event) =>
                setContractNumber(event.target.value)
              }
            />
          </div>
        )}


        <h3>Consents</h3>

        <label>
          <input
            type="checkbox"
            checked={serviceDataConsent}
            onChange={(event) =>
              setServiceDataConsent(event.target.checked)
            }
          />

          Service data consent
        </label>

        <br />

        <label>
          <input
            type="checkbox"
            checked={marketingConsent}
            onChange={(event) =>
              setMarketingConsent(event.target.checked)
            }
          />

          Marketing consent
        </label>

        <div>
          <button type="submit">
            Save repair
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditRepairForm;
