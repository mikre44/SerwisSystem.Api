import { useEffect, useState } from "react";
import { getProducts } from "../api/api";

// Product catalogue from the API: [{ name, serialRequired, serialHint }].
// The API is the single source of truth, including serial number validation.
function useProducts() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    getProducts()
      .then((data) => {
        if (!ignore) {
          setProducts(data);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setError(error.message);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return { products, error };
}

export default useProducts;
