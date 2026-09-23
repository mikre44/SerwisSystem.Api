import { useState } from "react";
import { updateRepair } from "../../api/api";

function EditRepairForm({ repair, onUpdated }) {
  const [status, setStatus] = useState(repair.status);
  const [productCategory, setProductCategory] = useState(repair.productCategory);
  const [product, setProduct] = useState(repair.product);
  const [serialNumber, setSerialNumber] = useState(repair.serialNumber);
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
  const [companyPhone, setCompanyPhone] = useState(repair.companyPhone);

  const [hasWarranty, setHasWarranty] = useState(repair.hasWarranty);
  const [purchaseDate, setPurchaseDate] = useState(
    repair.purchaseDate
      ? repair.purchaseDate.split("T")[0]
      : ""
  );
  const [purchaseInvoiceNumber, setPurchaseInvoiceNumber] = useState(
    repair.purchaseInvoiceNumber ?? ""
  );

  const [hasContract, setHasContract] = useState(repair.hasContract);
  const [contractNumber, setContractNumber] = useState(
    repair.contractNumber ?? ""
  );

  const [serviceDataConsent, setServiceDataConsent] = useState(
    repair.serviceDataConsent
  );

  const [marketingConsent, setMarketingConsent] = useState(
    repair.marketingConsent
  );


  
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

    if (!companyPhone.trim()) {
      errors.push("Company phone number is required.");
    } else if (!isValidPhone(companyPhone)) {
      errors.push("Company phone is invalid.");
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
    if (!productCategory) {
      errors.push("Product category is required.");
    }

    if (!product.trim()) {
      errors.push("Product is required.");
    }

    if (
      (
        productCategory === "Monitor" ||
        productCategory === "InteractiveBoard"
      ) &&
      !serialNumber.trim()
    ) {
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

    try {
      await updateRepair(repair.id, {
        status,

        productCategory,
        product: product.trim(),
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
        companyPhone: companyPhone.replace(/[^\d+]/g, ""),

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
            value={productCategory}
            onChange={(event) =>
              setProductCategory(event.target.value)
            }
          >
            <option value="Monitor">Monitor</option>
            <option value="InteractiveBoard">
              Interactive board
            </option>
            <option value="Projector">Projector</option>
            <option value="Computer">Computer</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label>Product: </label>

          <input
            required
            value={product}
            onChange={(event) =>
              setProduct(event.target.value)
            }
          />
        </div>

        <div>
          <label>Serial number: </label>

          <input
            required={
              productCategory === "Monitor" ||
              productCategory === "InteractiveBoard"
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

        <div>
          <label>Company phone: </label>

          <input
            required
            value={companyPhone}
            onChange={(event) =>
              setCompanyPhone(event.target.value)
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
