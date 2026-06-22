import { useState, useEffect, useCallback } from "react";

/**
 * useApi — run an API call with managed loading / error / data state.
 *
 *   const { data, loading, error, reload } = useApi(() => hrProjectsApi.list(), []);
 *
 * @param {Function} fn     async function returning the response
 * @param {Array}    deps   dependency list; the call re-runs when these change
 * @param {Object}   opts   { immediate = true }
 */
export function useApi(fn, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState("");

  const run = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fn();
      setData(res);
      return res;
    } catch (e) {
      setError(e.message || "Something went wrong.");
      throw e;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) run().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, reload: run, setData };
}
