import { AviationModule, AviationApiProvider, createDefaultApiClient } from "@heartex/aviation";
import { useMemo } from "react";
import type { Page } from "../types/Page";

export const AviationPage: Page = () => {
  const apiClient = useMemo(() => createDefaultApiClient(), []);

  return (
    <AviationApiProvider value={apiClient}>
      <AviationModule />
    </AviationApiProvider>
  );
};

AviationPage.title = "Aviation";
AviationPage.path = "/aviation";
