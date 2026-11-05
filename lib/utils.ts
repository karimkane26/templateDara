import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Assemble des classes CSS Tailwind (utilisé par les composants shadcn/ui).
 * Exemple : cn("px-2", estActif && "bg-primary", "px-4") -> "bg-primary px-4"
 * (si deux classes se contredisent, c'est la dernière qui gagne).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
