import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { setAgentActive } from "@/services/api";

interface AgentContextValue {
  active: boolean;
  toggle: () => void;
}

const AgentContext = createContext<AgentContextValue>({ active: true, toggle: () => {} });

export function AgentProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(true);

  const toggle = useCallback(() => {
    setActive((prev) => {
      const next = !prev;
      void setAgentActive(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ active, toggle }), [active, toggle]);
  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}

export function useAgent() {
  return useContext(AgentContext);
}
