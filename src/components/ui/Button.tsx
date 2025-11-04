import { cn } from "@/lib/cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" };

export const Button = ({ className, variant = "primary", ...props }: Props) => (
  <button className={cn(variant === "primary" ? "btn-primary" : "btn-ghost", className)} {...props} />
);
