import type { ButtonHTMLAttributes } from "react";

export function Button({
  className = "",
  variant = "default",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "ghost" }) {
  return <button type={type} className={`btn btn-${variant} ${className}`} {...props} />;
}
