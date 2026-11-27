import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const TIER_COLORS = {
  'Tier-1 Product': '#6366f1',
  'Tier-2 Service': '#10b981',
  Core: '#f59e0b',
};

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm ${className}`}
    >
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="h-72 w-full">{children}</div>
    </div>
  );
}

const CustomTooltipBox = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-lg border border-slate-700">
      {label !== undefined && <div className="font-semibold mb-1 text-indigo-300">{label}</div>}
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color || entry.fill || '#6366f1' }}
          />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function ChartsGrid({ charts }) {
  if (!charts) return null;

  const {
    branch_stats = [],
    yearly_trends = [],
    cgpa_vs_ctc = [],
    top_skills = [],
    tier_distribution = [],
  } = charts;

  const scatterByTier = {
    'Tier-1 Product': cgpa_vs_ctc.filter((d) => d.tier === 'Tier-1 Product'),
    'Tier-2 Service': cgpa_vs_ctc.filter((d) => d.tier === 'Tier-2 Service'),
    Core: cgpa_vs_ctc.filter((d) => d.tier === 'Core'),
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* 1. Branch-wise Placement Rate & Average CTC */}
      <ChartCard
        title="Branch-wise Placement Rate & Average CTC"
        subtitle="Placement % vs. Mean Salary Package (LPA) across departments"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={branch_stats} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
            <XAxis dataKey="branch" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} unit="%" />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} unit="L" />
            <Tooltip content={<CustomTooltipBox />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              yAxisId="left"
              dataKey="placement_rate"
              name="Placement %"
              fill="#6366f1"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              yAxisId="right"
              dataKey="avg_ctc"
              name="Avg CTC (LPA)"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 2. Multi-Year Placement & Salary Growth Trend */}
      <ChartCard
        title="Multi-Year Placement & Salary Growth Trend"
        subtitle="Historical progression across academic batches (2022–2026)"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={yearly_trends} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCtc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} unit="%" />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} unit="L" />
            <Tooltip content={<CustomTooltipBox />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="placement_rate"
              name="Placement %"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#colorRate)"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="avg_ctc"
              name="Avg CTC (LPA)"
              stroke="#06b6d4"
              strokeWidth={2.5}
              fill="url(#colorCtc)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 3. CGPA vs. CTC Distribution by Company Tier */}
      <ChartCard
        title="CGPA vs. CTC Distribution by Company Tier"
        subtitle="Correlation between academic score and offered compensation"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
            <XAxis
              type="number"
              dataKey="cgpa"
              name="CGPA"
              domain={[5.5, 10]}
              tick={{ fontSize: 11 }}
            />
            <YAxis type="number" dataKey="ctc_lpa" name="CTC (LPA)" unit="L" tick={{ fontSize: 11 }} />
            <ZAxis range={[45, 45]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-lg border border-slate-700">
                    <div className="font-semibold text-indigo-300">{d.company} ({d.tier})</div>
                    <div>Branch: {d.branch}</div>
                    <div>CGPA: {d.cgpa} • CTC: {d.ctc_lpa} LPA</div>
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {Object.entries(scatterByTier).map(([tierName, points]) =>
              points.length > 0 ? (
                <Scatter
                  key={tierName}
                  name={tierName}
                  data={points}
                  fill={TIER_COLORS[tierName] || '#6366f1'}
                  fillOpacity={0.75}
                />
              ) : null
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 5. Company Tier Hiring Distribution (Donut Chart) */}
      <ChartCard
        title="Company Tier Hiring Distribution"
        subtitle="Share of placed students across Tier-1 Product, Tier-2 Service & Core"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={tier_distribution}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={98}
              paddingAngle={4}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            >
              {tier_distribution.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={TIER_COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltipBox />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 4. Top 12 In-Demand Technical Skills & Average Salary (Full Width Horizontal Bar) */}
      <ChartCard
        title="Top 12 In-Demand Technical Skills & Average CTC"
        subtitle="Frequency among placed students and mean package associated with each skill"
        className="lg:col-span-2"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={top_skills}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="skill" width={110} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltipBox />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="count" name="Placed Students" fill="#6366f1" radius={[0, 6, 6, 0]} />
            <Bar dataKey="avg_ctc" name="Avg CTC (LPA)" fill="#f59e0b" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

