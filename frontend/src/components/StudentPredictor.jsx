import React, { useEffect, useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  CheckCircle2,
  PlusCircle,
  TrendingUp,
  Sliders,
} from 'lucide-react';
import { studentAPI } from '../services/api';

const ALL_SKILLS = [
  'Python',
  'Java',
  'C++',
  'React',
  'Node.js',
  'SQL',
  'Machine Learning',
  'AWS',
  'Docker',
  'Data Structures',
  'Power BI',
  'System Design',
];

const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'MECH'];
const TIERS = ['Tier-1 Product', 'Tier-2 Service', 'Core'];

function ReadinessGauge({ score, status }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score || 0));
  const offset = circumference - (clamped / 100) * circumference;

  const strokeColor =
    clamped >= 75 ? '#10b981' : clamped >= 50 ? '#6366f1' : '#f59e0b';

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-slate-100 dark:text-slate-800"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {clamped.toFixed(1)}%
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Readiness
          </span>
        </div>
      </div>
      <span
        className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
          clamped >= 75
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
            : clamped >= 50
            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
        }`}
      >
        {status}
      </span>
    </div>
  );
}

export default function StudentPredictor({ prefillProfile }) {
  const [profile, setProfile] = useState({
    cgpa: 7.8,
    backlogs: 0,
    internships: 1,
    projects: 3,
    coding_score: 72,
    branch: 'CSE',
    target_tier: 'Tier-1 Product',
    skills: ['Python', 'SQL', 'Data Structures'],
  });

  useEffect(() => {
    if (!prefillProfile) return;
    const parsedSkills = prefillProfile.skills
      ? prefillProfile.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Python'];
    setSimulatedSkills([]);
    setProfile({
      cgpa: prefillProfile.cgpa ?? 7.8,
      backlogs: prefillProfile.active_backlogs ?? 0,
      internships: prefillProfile.internships_count ?? 1,
      projects: prefillProfile.projects_count ?? 2,
      coding_score: prefillProfile.coding_score ?? 70,
      branch: prefillProfile.branch || 'CSE',
      target_tier:
        prefillProfile.company_tier && prefillProfile.company_tier !== 'None'
          ? prefillProfile.company_tier
          : 'Tier-1 Product',
      skills: parsedSkills,
    });
  }, [prefillProfile]);

  // Track simulated skills toggled in What-If Simulator
  const [simulatedSkills, setSimulatedSkills] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const effectiveSkills = Array.from(new Set([...profile.skills, ...simulatedSkills]));

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      studentAPI
        .predict({ ...profile, skills: effectiveSkills })
        .then((res) => {
          if (active) setPrediction(res);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    profile.cgpa,
    profile.backlogs,
    profile.internships,
    profile.projects,
    profile.coding_score,
    profile.branch,
    profile.target_tier,
    profile.skills,
    simulatedSkills,
  ]);

  const toggleBaseSkill = (skill) => {
    setSimulatedSkills((prev) => prev.filter((s) => s !== skill));
    setProfile((p) => {
      const exists = p.skills.includes(skill);
      return {
        ...p,
        skills: exists ? p.skills.filter((s) => s !== skill) : [...p.skills, skill],
      };
    });
  };

  const toggleSimulatedSkill = (skill) => {
    setSimulatedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <BrainCircuit className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Student Placement Predictor & "What-If" Simulator
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Adjust your academic profile and toggle recommended skills in real time to simulate placement probability and expected CTC.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Profile Form */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Sliders className="w-4 h-4 text-indigo-600" />
            Academic & Coding Profile
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Branch
              </label>
              <select
                value={profile.branch}
                onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Target Company Tier
              </label>
              <select
                value={profile.target_tier}
                onChange={(e) => setProfile({ ...profile, target_tier: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>CGPA</span>
                <span className="text-indigo-600 dark:text-indigo-400">{profile.cgpa.toFixed(2)} / 10.0</span>
              </div>
              <input
                type="range"
                min="5.5"
                max="10.0"
                step="0.05"
                value={profile.cgpa}
                onChange={(e) => setProfile({ ...profile, cgpa: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Coding Assessment Score</span>
                <span className="text-indigo-600 dark:text-indigo-400">{profile.coding_score} / 100</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="1"
                value={profile.coding_score}
                onChange={(e) => setProfile({ ...profile, coding_score: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-600"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Internships</span>
                  <span className="text-indigo-600">{profile.internships}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="1"
                  value={profile.internships}
                  onChange={(e) => setProfile({ ...profile, internships: parseInt(e.target.value, 10) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Projects</span>
                  <span className="text-indigo-600">{profile.projects}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="1"
                  value={profile.projects}
                  onChange={(e) => setProfile({ ...profile, projects: parseInt(e.target.value, 10) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Backlogs</span>
                  <span className="text-rose-600">{profile.backlogs}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="1"
                  value={profile.backlogs}
                  onChange={(e) => setProfile({ ...profile, backlogs: parseInt(e.target.value, 10) })}
                  className="w-full accent-rose-600"
                />
              </div>
            </div>
          </div>

          {/* Multi-select Skill Tags */}
          <div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Your Current Technical Skills ({profile.skills.length} selected)
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_SKILLS.map((skill) => {
                const selected = profile.skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleBaseSkill(skill)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                      selected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Predictions, Live What-If Simulator & Explainability */}
        <div className="lg:col-span-7 space-y-5">
          {/* Top Prediction Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <ReadinessGauge
              score={prediction?.placement_probability ?? 0}
              status={loading ? 'Calculating...' : prediction?.predicted_status ?? 'Ready'}
            />

            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700/60">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Estimated CTC
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {prediction ? `${prediction.predicted_ctc_lpa} LPA` : '—'}
                </div>
                <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                  Range: {prediction ? `${prediction.predicted_ctc_range[0]} – ${prediction.predicted_ctc_range[1]} LPA` : '—'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700/60">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Tier Skill Match
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {prediction ? `${prediction.skill_match_pct}%` : '—'}
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  vs. {profile.target_tier} alumni
                </div>
              </div>

              <div className="col-span-2 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300 mr-1">
                  Matched Key Skills:
                </span>
                {prediction?.matched_skills?.length ? (
                  prediction.matched_skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium"
                    >
                      <CheckCircle2 className="w-3 h-3" /> {s}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400">Add target-tier skills below to boost match</span>
                )}
              </div>
            </div>
          </div>

          {/* Live What-If Simulator */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Live "What-If" Skill Gap Simulator
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Toggle recommended missing skills ON/OFF to see your ML probability & CTC update live.
                </p>
              </div>
              {simulatedSkills.length > 0 && (
                <button
                  onClick={() => setSimulatedSkills([])}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Clear Simulated ({simulatedSkills.length})
                </button>
              )}
            </div>

            {simulatedSkills.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {simulatedSkills.map((sk) => (
                  <button
                    key={sk}
                    onClick={() => toggleSimulatedSkill(sk)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                  >
                    ✓ Simulating: {sk} (Click to remove)
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {prediction?.missing_recommended_skills?.map((item) => (
                <button
                  key={item.skill}
                  type="button"
                  onClick={() => toggleSimulatedSkill(item.skill)}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 hover:border-indigo-500 transition text-left group"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <PlusCircle className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition" />
                      {item.skill}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Held by {item.frequency_pct}% of {profile.target_tier} hires
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      +{item.simulated_probability_boost}% Prob
                    </div>
                    <div className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                      +{item.simulated_ctc_boost} LPA
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Feature Importance Explanations */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              ML Feature-Importance Explanations
            </h3>
            <div className="space-y-3">
              {prediction?.feature_importances?.map((f) => (
                <div key={f.feature}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {f.feature} <span className="text-slate-400 font-normal">({f.value})</span>
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {f.importance}% weight
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, f.importance * 2.2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

