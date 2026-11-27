import React, { useEffect, useState } from 'react';
import {
  Search,
  UserCheck,
  Award,
  BookOpen,
  Code2,
  Briefcase,
  Building2,
  Mail,
  Phone,
  Sparkles,
  ArrowRight,
  Users,
} from 'lucide-react';
import { studentAPI } from '../services/api';

const BRANCHES = ['All', 'CSE', 'IT', 'ECE', 'EEE', 'MECH'];
const CLASSES = ['All', '1st Year', '2nd Year', '3rd Year', '4th Year'];
const SECTIONS = ['All', 'A', 'B', 'C'];

export default function StudentDetailsPortal({ liveTick, onOpenSimulator }) {
  const [searchId, setSearchId] = useState('');
  const [filters, setFilters] = useState({ branch: 'All', class_year: 'All', section: 'All' });
  const [directory, setDirectory] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load quick directory for easy student lookup
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      studentAPI
        .getDirectory({ q: searchId, ...filters, limit: 8 })
        .then((rows) => {
          if (!active) return;
          setDirectory(rows);
          if (!selectedId && rows.length > 0) {
            setSelectedId(rows[0].student_id);
          }
        })
        .catch(() => {});
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchId, filters, liveTick]);

  // Fetch full student details whenever selectedId or liveTick updates
  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    setLoading(true);
    setError('');
    studentAPI
      .lookup(selectedId)
      .then((res) => {
        if (active) setProfileData(res);
      })
      .catch((err) => {
        if (active) {
          setError(err.response?.data?.detail || 'Student not found.');
          setProfileData(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId, liveTick]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      setSelectedId(searchId.trim().toUpperCase());
    }
  };

  const st = profileData?.student;
  const ml = profileData?.ml_insights;
  const peers = profileData?.peer_benchmarks;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <UserCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          My Details & Placement Knowledge Hub
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Look up your live academic record by Student ID, Name, Department, Class, or Section and view personalized ML placement insights.
        </p>
      </div>

      {/* Search & Quick Directory */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Student ID (e.g. STU2026CS0001) or Name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filters.branch}
            onChange={(e) => setFilters((f) => ({ ...f, branch: e.target.value }))}
            className="px-3 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            {BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b === 'All' ? 'All Departments' : b}
              </option>
            ))}
          </select>

          <select
            value={filters.class_year}
            onChange={(e) => setFilters((f) => ({ ...f, class_year: e.target.value }))}
            className="px-3 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
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
            className="px-3 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            {SECTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Sections' : `Section ${s}`}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
          >
            Lookup ID
          </button>
        </form>

        {/* Quick Select Pills */}
        {directory.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Quick Select:
            </span>
            {directory.map((item) => (
              <button
                key={item.student_id}
                type="button"
                onClick={() => setSelectedId(item.student_id)}
                className={`px-3 py-1 rounded-xl text-xs font-medium border transition ${
                  selectedId === item.student_id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                {item.name} ({item.branch} • {item.class_year} - {item.section})
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
          {error}
        </div>
      )}

      {loading && !st && (
        <div className="p-12 text-center text-sm text-slate-500">Loading student record...</div>
      )}

      {st && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Official Student Record Card */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                  {st.student_id}
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {st.name}
                </h2>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {st.branch} • {st.class_year} • Section {st.section} • Batch {st.batch_year}
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  st.placement_status
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                }`}
              >
                {st.placement_status ? 'Placed' : 'In Training / Seeking'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                <div className="text-slate-500 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" /> CGPA
                </div>
                <div className="text-lg font-bold mt-0.5">{st.cgpa.toFixed(2)} / 10</div>
                <div className="text-[11px] text-slate-400">
                  10th: {st.tenth_percent}% • 12th: {st.twelfth_percent}%
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                <div className="text-slate-500 flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5" /> Coding Score
                </div>
                <div className="text-lg font-bold mt-0.5">{st.coding_score} / 100</div>
                <div className="text-[11px] text-slate-400">
                  Active Backlogs: {st.active_backlogs}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                <div className="text-slate-500 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" /> Experience
                </div>
                <div className="text-sm font-bold mt-1">
                  {st.internships_count} Internships • {st.projects_count} Projects
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                <div className="text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> Placement Offer
                </div>
                <div className="text-sm font-bold mt-1">
                  {st.placement_status ? `${st.company_name} (${st.ctc_lpa} LPA)` : 'Not Placed Yet'}
                </div>
                {st.placement_status && (
                  <div className="text-[11px] text-indigo-500">{st.company_tier}</div>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                Verified Technical Skills
              </div>
              <div className="flex flex-wrap gap-1.5">
                {st.skills.split(',').map((sk) => (
                  <span
                    key={sk.trim()}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300"
                  >
                    {sk.trim()}
                  </span>
                ))}
              </div>
            </div>

            {(st.email || st.phone) && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 text-xs text-slate-500">
                {st.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> {st.email}
                  </span>
                )}
                {st.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> {st.phone}
                  </span>
                )}
              </div>
            )}

            {onOpenSimulator && (
              <button
                type="button"
                onClick={() => onOpenSimulator(st)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
              >
                <Sparkles className="w-4 h-4" />
                Load My Profile into What-If Simulator
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right: Live ML Insights & Department/Class/Section Benchmarks */}
          <div className="lg:col-span-7 space-y-5">
            {ml && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600" />
                    Personalized Placement Readiness & Skill Gap
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                    {ml.predicted_status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <div className="text-xs text-slate-500">Readiness Score</div>
                    <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                      {ml.placement_probability}%
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <div className="text-xs text-slate-500">Predicted CTC</div>
                    <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                      {ml.predicted_ctc_lpa} LPA
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <div className="text-xs text-slate-500">Tier Skill Match</div>
                    <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {ml.skill_match_pct}%
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                    Top Recommended Skills to Boost Your Profile
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ml.missing_recommended_skills?.slice(0, 4).map((item) => (
                      <div
                        key={item.skill}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40"
                      >
                        <div>
                          <div className="text-xs font-bold">{item.skill}</div>
                          <div className="text-[11px] text-slate-500">
                            {item.frequency_pct}% of placed peers have this
                          </div>
                        </div>
                        <div className="text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          +{item.simulated_probability_boost}% Prob
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {peers && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Live Peer Benchmarks ({st.branch} & {st.class_year} Sec {st.section})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1.5">
                    <div className="font-bold text-slate-700 dark:text-slate-200">
                      {st.branch} Department ({peers.department.count} students)
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Avg CGPA:</span>
                      <span className="font-semibold">{peers.department.avg_cgpa}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Avg Coding Score:</span>
                      <span className="font-semibold">{peers.department.avg_coding}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Placement Rate:</span>
                      <span className="font-semibold text-emerald-600">{peers.department.placement_rate}%</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1.5">
                    <div className="font-bold text-slate-700 dark:text-slate-200">
                      {st.class_year} • Section {st.section} ({peers.class_section.count} students)
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Avg CGPA:</span>
                      <span className="font-semibold">{peers.class_section.avg_cgpa}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Avg Coding Score:</span>
                      <span className="font-semibold">{peers.class_section.avg_coding}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Placement Rate:</span>
                      <span className="font-semibold text-emerald-600">{peers.class_section.placement_rate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

