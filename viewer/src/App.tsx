import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { AppShell } from "./components/AppShell";
import { getParserBackend, setParserBackend } from "./platform";
import type { ParserBackend } from "./platform/types";
import { queryClient } from "./lib/queryClient";
import { useSessionStore } from "./stores/sessionStore";

export interface ViewerAppProps {
  backend?: ParserBackend;
}

export function ViewerApp({ backend }: ViewerAppProps) {
  const setProgress = useSessionStore((s) => s.setProgress);

  useEffect(() => {
    if (backend) {
      setParserBackend(backend);
    }
  }, [backend]);

  useEffect(() => {
    const active = getParserBackend();
    return active.onProgress(setProgress);
  }, [backend, setProgress]);

  return (
    <MantineProvider defaultColorScheme="dark">
      <QueryClientProvider client={queryClient}>
        <AppShell />
      </QueryClientProvider>
    </MantineProvider>
  );
}

export default ViewerApp;
