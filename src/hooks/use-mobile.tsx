import * as React from "react";

// Brytpunkt for å regne som 'mobil' (px)
const MOBILE_BREAKPOINT = 768;

// Enkel hook som returnerer true/false om skjermen er mobil-størrelse
export function useIsMobile() {
  // isMobile kan være undefined inntil vi kjører effekten første gang
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // Bruker matchMedia for å lytte til endringer i skjermbredde
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    // Handler som oppdaterer state basert på current window width
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Legg på event listener for endringer
    mql.addEventListener("change", onChange);

    // Sett initial verdi basert på nåværende vindusbredde
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    // Rydd opp når komponent unmounter
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Garanter en boolean tilbake (false hvis undefined)
  return !!isMobile;
}
