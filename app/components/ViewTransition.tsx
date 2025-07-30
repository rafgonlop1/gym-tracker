import { ReactNode } from "react";

interface ViewTransitionProps {
  children: ReactNode;
  className?: string;
}

export function ViewTransition({ children, className = "" }: ViewTransitionProps) {
  return (
    <div className={`animate-fadeIn ${className}`}>
      {children}
    </div>
  );
}