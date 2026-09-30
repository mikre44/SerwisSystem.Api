import { useEffect, useState } from "react";
import { getProducts } from "../api/api";

// Product catalogue from the API: [{ name, serialRequired, serialHint }],
// where serialHint may be null. The API is the single source of truth,
// including serial number validation.
function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
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
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return { products, loading, error };
}

export default useProducts;
