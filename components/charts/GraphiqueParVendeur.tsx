"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  vendeurs: string[];
}

function formatFCFA(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "k";
  return String(n);
}

const COLORS = [
  "#0057A8", "#E67E22", "#27AE60", "#8E44AD", "#F1C40F", "#E74C3C", "#34495E"
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex justify-between items-center gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
            <span className="text-gray-600">{entry.name}</span>
          </div>
          <span className="font-bold whitespace-nowrap" style={{ color: entry.color }}>
            {new Intl.NumberFormat("fr-FR").format(entry.value)} FCFA
          </span>
        </div>
      ))}
    </div>
  );
}

export default function GraphiqueParVendeur({ data, vendeurs }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={250}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={35}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="mois"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatFCFA}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
        {vendeurs.map((vendeur, i) => (
          <Bar key={vendeur} dataKey={vendeur} stackId="a" fill={COLORS[i % COLORS.length]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
