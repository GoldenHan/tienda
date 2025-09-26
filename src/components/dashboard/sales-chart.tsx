"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { useTheme } from "next-themes";

interface SalesChartProps {
  data: {
    name: string
    total: number
  }[]
}

export function SalesChart({ data }: SalesChartProps) {
  const { theme } = useTheme();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: "NIO",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
    
  // Get HSL values from CSS variables
  const getCssVarValue = (varName: string) => {
    if (typeof window === 'undefined') return '';
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }

  const primaryColor = `hsl(${getCssVarValue('--primary')})`;
  const mutedForegroundColor = `hsl(${getCssVarValue('--muted-foreground')})`;
  const cardColor = `hsl(${getCssVarValue('--card')})`;
  const borderColor = `hsl(${getCssVarValue('--border')})`;
  const accentColor = `hsl(${getCssVarValue('--accent')})`;
  const foregroundColor = `hsl(${getCssVarValue('--foreground')})`;


  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={borderColor} opacity={0.5} />
        <XAxis
          dataKey="name"
          stroke={mutedForegroundColor}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={mutedForegroundColor}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCurrency(value as number)}
          width={80}
        />
        <Tooltip
            cursor={{ fill: accentColor, opacity: 0.5 }}
            contentStyle={{
                backgroundColor: cardColor,
                border: `1px solid ${borderColor}`,
                borderRadius: "var(--radius)",
            }}
            labelStyle={{ color: foregroundColor, fontWeight: 'bold' }}
            itemStyle={{ fontWeight: 'bold' }}
            formatter={(value) => formatCurrency(value as number)}
        />
        <Bar dataKey="total" fill={primaryColor} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
