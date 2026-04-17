"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface Point {
  mois:   string;
  total:  number;
  count:  number;
}

interface Props {
  data: Point[];
}

function formatFCFA(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "k";
  return String(n);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-brand-bleu font-bold">
        {new Intl.NumberFormat("fr-FR").format(payload[0].value)} FCFA
      </p>
      <p className="text-gray-400">{payload[0].payload.count} vente(s)</p>
    </div>
  );
}

export default function GrafiqueVentes({ data }: Props) {
  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={28}>
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
        <Bar dataKey="total" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={d.total === max ? "#0057A8" : "#bfdbfe"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
