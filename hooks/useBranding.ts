import useAuthStore from "./Authstate";

export type Branding = {
  companyName: string;
  companyShortName: string;
};

export const DEFAULT_BRANDING: Branding = {
  companyName: "Hostel Management",
  companyShortName: "HMS",
};

export function useBranding(): Branding {
  const systemSettings = useAuthStore((state) => state.user?.systemSettings);

  if (!systemSettings) return DEFAULT_BRANDING;

  return {
    companyName: (systemSettings.companyName as unknown as string) || DEFAULT_BRANDING.companyName,
    companyShortName: (systemSettings.companyShortName as unknown as string) || DEFAULT_BRANDING.companyShortName,
  };
}
