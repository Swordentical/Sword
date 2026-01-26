import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ArcadeContextType {
  isOpen: boolean;
  openArcade: () => void;
  closeArcade: () => void;
}

const ArcadeContext = createContext<ArcadeContextType | null>(null);

export function ArcadeProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openArcade = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeArcade = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <ArcadeContext.Provider value={{ isOpen, openArcade, closeArcade }}>
      {children}
    </ArcadeContext.Provider>
  );
}

export function useArcade() {
  const context = useContext(ArcadeContext);
  if (!context) {
    throw new Error("useArcade must be used within an ArcadeProvider");
  }
  return context;
}
