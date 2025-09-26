
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
  variant?: "default" | "destructive" | "success" | "info";
}

export default function StatCard({ title, value, icon: Icon, description, variant = 'default' }: StatCardProps) {
  
  const variants = {
    default: {
      card: "border-primary/20 hover:border-primary/50",
      iconContainer: "bg-primary/10",
      icon: "text-primary",
    },
    destructive: {
      card: "border-destructive/20 hover:border-destructive/50",
      iconContainer: "bg-destructive/10",
      icon: "text-destructive",
    },
    success: {
       card: "border-emerald-500/20 hover:border-emerald-500/50",
       iconContainer: "bg-emerald-500/10",
       icon: "text-emerald-600",
    },
    info: {
       card: "border-sky-500/20 hover:border-sky-500/50",
       iconContainer: "bg-sky-500/10",
       icon: "text-sky-600",
    }
  }
  
  const selectedVariant = variants[variant] || variants.default;

  return (
    <Card className={cn(
        "transition-all duration-300 hover:shadow-xl hover:-translate-y-1 backdrop-blur-sm bg-background/50 border",
        selectedVariant.card
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("flex items-center justify-center rounded-lg p-2", selectedVariant.iconContainer)}>
            <Icon className={cn("h-5 w-5", selectedVariant.icon)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
