// Importerer router-komponent og utility-funksjoner
import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

// Interface for komponent-props med CSS-klasser
interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

// Custom NavLink-komponent som wrapprer React Router NavLink
const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    // Returnerer RouterNavLink med dynamic class-navn basert på tilstand
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          // Kombinerer klasser basert på aktiv eller pending-tilstand
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

// Setter display-name for debugging
NavLink.displayName = "NavLink";

// Eksporterer komponenten
export { NavLink };
