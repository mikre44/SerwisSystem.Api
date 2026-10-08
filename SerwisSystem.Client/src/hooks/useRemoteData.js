import { useCallback, useEffect, useState } from "react";

export function useRemoteData(loadData) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState({ request: null, revision: -1, data: null, error: "" });
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    const requestController = new AbortController();
    loadData(requestController.signal).then(data => {
      if (!requestController.signal.aborted) setResult({ request: loadData, revision, data, error: "" });
    }).catch(error => {
      if (!requestController.signal.aborted) setResult({ request: loadData, revision, data: null, error: error.message });
    });
    return () => requestController.abort();
  }, [loadData, revision]);
  const loading = result.request !== loadData || result.revision !== revision;
  return { data: result.data, error: loading ? "" : result.error, loading, reload };
}
