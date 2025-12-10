// Importer routing-hooks
import { useLocation } from "react-router-dom";
// Importer React-hooks
import { useEffect } from "react";

// 404-side: vises når bruker prøver å få tilgang til en rute som ikke finnes
const NotFound = () => {
  // Hent nåværende URL-path
  const location = useLocation();

  // Logger 404-feil når komponenten monteres eller path endrer seg
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        {/* Feilkode */}
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        {/* Feilmelding */}
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        {/* Lenke tilbake til hjem */}
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

// Eksporter komponenten
export default NotFound;
