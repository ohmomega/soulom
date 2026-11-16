import { useCallback, useState } from "react";
import { localVault } from "../lib/localVault";
import type { StoredLicense } from "../types/chat";

export type LicenseHealth = "none" | "active" | "rejected";

export function useSupporterLicense() {
  const [license, setLicense] = useState<StoredLicense | null>(() => localVault.loadLicense());
  const [health, setHealth] = useState<LicenseHealth>(() => (localVault.loadLicense() ? "active" : "none"));

  const activate = useCallback((nextLicense: StoredLicense) => {
    localVault.saveLicense(nextLicense);
    setLicense(nextLicense);
    setHealth("active");
  }, []);

  const forget = useCallback(() => {
    localVault.saveLicense(null);
    setLicense(null);
    setHealth("none");
  }, []);

  const reportServerVerdict = useCallback((isActive: boolean, expiresAt?: string | null) => {
    setHealth(isActive ? "active" : "rejected");
    if (isActive && expiresAt !== undefined) {
      setLicense((current) => {
        if (!current || current.expiresAt === expiresAt) return current;
        const refreshed = { ...current, expiresAt };
        localVault.saveLicense(refreshed);
        return refreshed;
      });
    }
  }, []);

  return { license, health, activate, forget, reportServerVerdict };
}

export type SupporterLicense = ReturnType<typeof useSupporterLicense>;
