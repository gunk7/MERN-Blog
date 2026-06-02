import { useState, useCallback } from "react";
import API from "../services/axios";

export function useUsage() {
  const [usage, setUsage] = useState(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

  const fetchUsage = useCallback(async () => {
    try {
      setLoadingUsage(true);
      const { data } = await API.get("/chat/usage/me");
      if (data.success) setUsage(data.usage);
    } catch {
      // fail silently — usage display is non-critical
    } finally {
      setLoadingUsage(false);
    }
  }, []);

  return { usage, loadingUsage, fetchUsage };
}
