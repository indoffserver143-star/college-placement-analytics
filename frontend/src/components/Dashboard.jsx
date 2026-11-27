import React, { useEffect, useRef, useState } from 'react';
import {
  Users,
  Award,
  TrendingUp,
  IndianRupee,
  Building2,
  Download,
  RotateCcw,
  Filter,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { analyticsAPI } from '../services/api';
import ChartsGrid from './ChartsGrid';

const YEARS = ['All', '2022', '2023', '2024', '2025', '2026'];
const BRANCHES = ['All', 'CSE', 'IT', 'ECE', 'EEE', 'MECH'];
const CLASSES = ['All', '1st Year', '2nd Year', '3rd Year', '4th Year'];
const SECTIONS = ['All', 'A', 'B', 'C'];
const TIERS = ['All', 'Tier-1 Product', 'Tier-2 Service', 'Core'];

function KpiCard({ title, value, subtitle, icon: Icon, colorClass }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm flex items-start justify-between">
      <div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</div>
        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</div>
        {subtitle && (
          <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1">
            {subtitle}
          </div>
        )}
      </div>
      <div className={`p-2.5 rounded-xl ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

export default function Dashboard({ liveTick }) {
  const [filters, setFilters] = useState({
    year: 'All',
    branch: 'All',
    class_year: 'All',
    section: 'All',
    tier: 'All',
  });
  const [overview, setOverview] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    let active = true;
    if (!overview) setLoading(true);
    Promise.all([analyticsAPI.getOverview(filters), analyticsAPI.getCharts(filters)])
      .then(([ov, ch]) => {
        if (!active) return;
        setOverview(ov);
        setCharts(ch);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters, liveTick]);

  const resetFilters = () =>
    setFilters({ year: 'All', branch: 'All', class_year: 'All', section: 'All', tier: 'All' });

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: document.documentElement.classList.contains('dark')
          ? '#020617'
          : '#f8fafc',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.setFontSize(11);
      pdf.text(
        `Placement Report (Year: ${filters.year} | Dept: ${filters.branch} | Class: ${filters.class_year} | Sec: ${filters.section})`,
        10,
        10
      );
      pdf.addImage(imgData, 'PNG', 5, 15, pdfWidth - 10, Math.min(pdfHeight, 275));
      pdf.save(`Placement_Report_${filters.year}_${filters.branch}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Global Filter Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Executive Placement Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time multi-year placement outcomes, salary distributions, and skill demand
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </div>

          <select
            value={filters.year}
            onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}
            className="px-2.5 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y === 'All' ? 'All Years' : `Batch ${y}`}
              </option>
            ))}
          </select>

          <select
            value={filters.branch}
            onChange={(e) => setFilters((f) => ({ ...f, branch: e.target.value }))}
            className="px-2.5 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
          >
            {BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b === 'All' ? 'All Depts' : b}
              </option>
            ))}
          </select>

          <select
            value={filters.class_year}
            onChange={(e) => setFilters((f) => ({ ...f, class_year: e.target.value }))}
            className="px-2.5 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
          >
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Classes' : c}
              </option>
            ))}
          </select>

          <select
            value={filters.section}
            onChange={(e) => setFilters((f) => ({ ...f, section: e.target.value }))}
            className="px-2.5 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
          >
            {SECTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Sections' : `Sec ${s}`}
              </option>
            ))}
          </select>

          <select
            value={filters.tier}
            onChange={(e) => setFilters((f) => ({ ...f, tier: e.target.value }))}
            className="px-2.5 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t === 'All' ? 'All Tiers' : t}
              </option>
            ))}
          </select>

          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exporting || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Report Container */}
      <div ref={reportRef} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard
            title="Eligible Students"
            value={loading ? '—' : overview?.total_eligible ?? 0}
            subtitle="Live cohort"
            icon={Users}
            colorClass="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
          />
          <KpiCard
            title="Total Placed"
            value={loading ? '—' : overview?.total_placed ?? 0}
            subtitle="Verified offers"
            icon={Award}
            colorClass="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
          />
          <KpiCard
            title="Placement Rate"
            value={loading ? '—' : `${overview?.placement_rate ?? 0}%`}
            subtitle="Overall conversion"
            icon={TrendingUp}
            colorClass="bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400"
          />
          <KpiCard
            title="Average CTC"
            value={loading ? '—' : `${overview?.avg_ctc ?? 0} LPA`}
            subtitle={`Median: ${overview?.median_ctc ?? 0} LPA`}
            icon={IndianRupee}
            colorClass="bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
          />
          <KpiCard
            title="Highest CTC"
            value={loading ? '—' : `${overview?.highest_ctc ?? 0} LPA`}
            subtitle="Peak package"
            icon={TrendingUp}
            colorClass="bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400"
          />
          <KpiCard
            title="Top Recruiter"
            value={loading ? '—' : overview?.top_recruiter ?? 'N/A'}
            subtitle="Highest hire volume"
            icon={Building2}
            colorClass="bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
          />
        </div>

        {loading ? (
          <div className="h-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-sm text-slate-500">
            Loading placement analytics...
          </div>
        ) : (
          <ChartsGrid charts={charts} />
        )}
      </div>
    </div>
  );
}
