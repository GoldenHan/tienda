
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description: string;
  variant?: "default" | "destructive" | "secondary";
}

export default function StatCard({ title, value, icon: Icon, description, variant = 'default' }: StatCardProps) {
  const cardClasses = cn(
    "transition-transform hover:-translate-y-1",
    {
      "bg-card text-card-foreground": variant === "default",
      "bg-destructive/10 border-destructive/50": variant === "destructive",
      "bg-secondary/50": variant === "secondary",
    }
  );

  const iconClasses = cn({
    "text-muted-foreground": variant !== "destructive",
    "text-destructive": variant === "destructive",
  });

  const valueClasses = cn("text-2xl font-bold font-headline", {
    "text-destructive": variant === "destructive",
  });

  return (
    <Card className={cardClasses}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={valueClasses}>{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
