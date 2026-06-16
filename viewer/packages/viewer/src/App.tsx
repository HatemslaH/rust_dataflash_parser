import { useEffect } from "react";
import { AppShell } from "./components/AppShell";
import { getParserBackend, setParserBackend } from "./platform";
import { useSessionStore } from "./stores/session";

export interface ViewerAppProps {
  backend?: import("./platform/types").ParserBackend;
}

export function ViewerApp({ backend }: ViewerAppProps) {
  const setProgress = useSessionStore((s) => s.setProgress);

  useEffect(() => {
    if (backend) {
      setParserBackend(backend);
    }
    const active = getParserBackend();
    return active.onProgress(setProgress);
  }, [backend, setProgress]);

  return <AppShell />;
}

export { AppShell } from "./components/AppShell";
export * from "./platform";
