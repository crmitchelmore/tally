import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormPanelProps {
  children: ReactNode;
  className?: string;
}

export function FormPanel({ children, className }: FormPanelProps) {
  return (
    <div className={cn("mx-auto w-full max-w-[480px]", className)}>
      {children}
    </div>
  );
}
