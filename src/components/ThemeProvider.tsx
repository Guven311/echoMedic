// Importerer React-hooks som brukes av ThemeProvider
import { createContext, useContext, useEffect, useState } from "react";

// Typer for tema-verdier
type Theme = "dark" | "light" | "system";

// Props for ThemeProvider
type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

// State-objekt som deles i context
type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

// Initial verdi for context (brukes kun i default case)
const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "echomedic-theme",
  ...props
}: ThemeProviderProps) {
  // Leser lagret tema fra localStorage ved init, eller bruker default
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  // Effect som oppdaterer <html> med korrekt tema-klasse
  useEffect(() => {
    const root = window.document.documentElement;

    // Fjern evt. tidligere tema-klasser
    root.classList.remove("light", "dark");

    // Hvis valgt "system", bestem systemtema og sett det
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    // Legger på valgt tema-klasse ("light" eller "dark")
    root.classList.add(theme);
  }, [theme]);

  // Value som sendes via context til appen
  const value = {
    theme,
    setTheme: (theme: Theme) => {
      // Lagre valgt tema lokalt slik at brukerens valg huskes
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  // Provider som gjør tema tilgjengelig i hele komponent-treet
  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
