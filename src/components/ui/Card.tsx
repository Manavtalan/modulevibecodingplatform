import { cn } from "@/lib/cn";

export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("card", className)} {...props} />
);
