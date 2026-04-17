"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

interface Point {
  jour: string;
  total: number;
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
    </div>
  );
}

export default function Graphique7Jours({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={250}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0057A8" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#0057A8" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="jour"
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
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="total" stroke="#0057A8" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
