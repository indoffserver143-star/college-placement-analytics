import React, { useEffect, useState } from 'react';
import {
  UploadCloud,
  Download,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { adminAPI } from '../services/api';

const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'MECH'];
const CLASSES = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const SECTIONS = ['A', 'B', 'C'];
const ALL_SKILLS = [
  'Python', 'Java', 'C++', 'React', 'Node.js', 'SQL',
  'Machine Learning', 'AWS', 'Docker', 'Data Structures',
  'Power BI', 'System Design',
];

const EMPTY_FORM = {
  student_id: '',
  name: '',
  branch: 'CSE',
  class_year: '4th Year',
  section: 'A',
  batch_year: 2026,
  gender: 'Male',
  email: '',
  phone: '',
  cgpa: 8.0,
  tenth_percent: 85.0,
  twelfth_percent: 84.0,
  active_backlogs: 0,
  internships_count: 1,
  projects_count: 2,
  coding_score: 75,
  skills: ['Python', 'SQL'],
  placement_status: false,
  company_name: 'None',
  company_tier: 'None',
  ctc_lpa: 0.0,
};

export default function AdminPortal({ liveTick }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const [retraining, setRetraining] = useState(false);
  const [retrainMsg, setRetrainMsg] = useState('');

  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('All');
  const [classYear, setClassYear] = useState('All');
  const [section, setSection] = useState('All');
  const [loadingTable, setLoadingTable] = useState(false);

  // Add/Edit Student Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchRecords = async (p = page) => {
    setLoadingTable(true);
    try {
      const data = await adminAPI.getRecords({
        search,
        branch,
        class_year: classYear,
        section,
        page: p,
        limit: 10,
      });
      setRecords(data.records);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecords(1);
      setPage(1);
    }, 200);
    return () => clearTimeout(timer);
  }, [search, branch, classYear, section, liveTick]);

  const openAddModal = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      branch: branch !== 'All' ? branch : 'CSE',
      class_year: classYear !== 'All' ? classYear : '4th Year',
      section: section !== 'All' ? section : 'A',
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (r) => {
    setEditingId(r.student_id);
    setForm({
      student_id: r.student_id,
      name: r.name,
      branch: r.branch,
      class_year: r.class_year || '4th Year',
      section: r.section || 'A',
      batch_year: r.batch_year,
      gender: r.gender || 'Male',
      email: r.email || '',
      phone: r.phone || '',
      cgpa: r.cgpa,
      tenth_percent: r.tenth_percent,
      twelfth_percent: r.twelfth_percent,
      active_backlogs: r.active_backlogs,
      internships_count: r.internships_count,
      projects_count: r.projects_count,
      coding_score: r.coding_score,
      skills: r.skills ? r.skills.split(',').map((s) => s.trim()).filter(Boolean) : ['Python'],
      placement_status: Boolean(r.placement_status),
      company_name: r.company_name || 'None',
      company_tier: r.company_tier || 'None',
      ctc_lpa: r.ctc_lpa || 0.0,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setFormError('');
    if (form.skills.length === 0) {
      setFormError('Please select at least one technical skill.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        batch_year: Number(form.batch_year),
        cgpa: Number(form.cgpa),
        tenth_percent: Number(form.tenth_percent),
        twelfth_percent: Number(form.twelfth_percent),
        active_backlogs: Number(form.active_backlogs),
        internships_count: Number(form.internships_count),
        projects_count: Number(form.projects_count),
        coding_score: Number(form.coding_score),
        skills: form.skills.join(', '),
        ctc_lpa: form.placement_status ? Number(form.ctc_lpa) : 0.0,
        company_name: form.placement_status ? form.company_name : 'None',
        company_tier: form.placement_status ? form.company_tier : 'None',
      };

      if (editingId) {
        await adminAPI.updateRecord(editingId, payload);
      } else {
        await adminAPI.createRecord(payload);
      }
      setModalOpen(false);
      fetchRecords(page);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save student record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm(`Delete student record ${studentId}?`)) return;
    await adminAPI.deleteRecord(studentId);
    fetchRecords(page);
  };

  const handleFile = async (file) => {
    if (!file) return;
    setUploadError('');
    setUploadResult(null);
    setUploading(true);
    try {
      const res = await adminAPI.uploadCSV(file);
      setUploadResult(res);
      fetchRecords(1);
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'CSV upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainMsg('');
    try {
      const res = await adminAPI.retrainModels();
      const m = res.metrics;
      setRetrainMsg(
        `Models retrained on ${m.total_records} records • Classifier Accuracy: ${m.classifier_accuracy_pct}% • CTC R²: ${m.regressor_r2}`
      );
    } finally {
      setRetraining(false);
    }
  };

  const toggleFormSkill = (sk) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(sk)
        ? prev.skills.filter((s) => s !== sk)
        : [...prev.skills, sk],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Admin Data Management Portal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enter, edit, or bulk-upload student details organized by Department/Branch, Class, and Section.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
          >
            <UserPlus className="w-3.5 h-3.5" /> Add Student Record
          </button>

          <button
            onClick={() => adminAPI.downloadSampleCSV()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Download className="w-3.5 h-3.5" /> Sample CSV
          </button>

          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
            {retraining ? 'Retraining...' : 'Retrain ML Models'}
          </button>
        </div>
      </div>

      {retrainMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {retrainMsg}
        </div>
      )}

      {/* Drag & Drop CSV Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
        }}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
        }`}
      >
        <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {uploading ? 'Uploading & Broadcasting Real-Time Update...' : 'Drag & Drop a .CSV file for Bulk Class/Section Import'}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">
          Supports Department, Class, Section, Academic & Placement fields. Updates all dashboards live.
        </p>
        <label className="inline-block px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white text-xs font-semibold cursor-pointer hover:opacity-90 transition">
          Select CSV File
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
      </div>

      {uploadError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {uploadError}
        </div>
      )}

      {uploadResult && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
            <span className="text-emerald-600 dark:text-emerald-400">
              ✓ Imported: {uploadResult.imported_count} rows
            </span>
            <span className="text-rose-600 dark:text-rose-400">
              ✕ Rejected: {uploadResult.rejected_count} rows
            </span>
          </div>
          {uploadResult.rejected_rows?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2 pr-4">CSV Row</th>
                    <th className="py-2 pr-4">Student ID</th>
                    <th className="py-2">Validation Error</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadResult.rejected_rows.map((r, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60">
                      <td className="py-2 pr-4 font-mono">{r.row}</td>
                      <td className="py-2 pr-4">{r.student_id}</td>
                      <td className="py-2 text-rose-600 dark:text-rose-400">{r.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Searchable, Paginated Student Records Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            Student Records ({total})
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ID, name, email, skill..."
                className="pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              {['All', ...BRANCHES].map((b) => (
                <option key={b} value={b}>
                  {b === 'All' ? 'All Depts' : b}
                </option>
              ))}
            </select>

            <select
              value={classYear}
              onChange={(e) => setClassYear(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              {['All', ...CLASSES].map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Classes' : c}
                </option>
              ))}
            </select>

            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              {['All', ...SECTIONS].map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All Sections' : `Sec ${s}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-2">ID</th>
                <th className="py-2.5 px-2">Name</th>
                <th className="py-2.5 px-2">Dept / Class / Sec</th>
                <th className="py-2.5 px-2">CGPA</th>
                <th className="py-2.5 px-2">Coding</th>
                <th className="py-2.5 px-2">Status</th>
                <th className="py-2.5 px-2">Company (Tier)</th>
                <th className="py-2.5 px-2">CTC</th>
                <th className="py-2.5 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loadingTable ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    Loading records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-2 font-mono text-slate-600 dark:text-slate-400">
                      {r.student_id}
                    </td>
                    <td className="py-2.5 px-2 font-semibold text-slate-900 dark:text-white">
                      {r.name}
                    </td>
                    <td className="py-2.5 px-2">
                      {r.branch} • {r.class_year} ({r.section})
                    </td>
                    <td className="py-2.5 px-2">{r.cgpa.toFixed(2)}</td>
                    <td className="py-2.5 px-2">{r.coding_score}</td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold ${
                          r.placement_status
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {r.placement_status ? 'Placed' : 'Unplaced'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      {r.placement_status ? `${r.company_name} (${r.company_tier})` : '—'}
                    </td>
                    <td className="py-2.5 px-2 font-semibold">
                      {r.placement_status ? `${r.ctc_lpa} LPA` : '—'}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(r)}
                          title="Edit Student"
                          className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.student_id)}
                          title="Delete Student"
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => {
                const next = page - 1;
                setPage(next);
                fetchRecords(next);
              }}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => {
                const next = page + 1;
                setPage(next);
                fetchRecords(next);
              }}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingId ? `Edit Student (${editingId})` : 'Add Student Record by Dept / Class / Section'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              {/* Section 1: Department / Class / Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Department / Branch *</label>
                  <select
                    value={form.branch}
                    onChange={(e) => setForm({ ...form, branch: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Class *</label>
                  <select
                    value={form.class_year}
                    onChange={(e) => setForm({ ...form, class_year: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    {CLASSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Section *</label>
                  <select
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    {SECTIONS.map((s) => (
                      <option key={s} value={s}>Section {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 2: Identity & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Student ID *</label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingId)}
                    value={form.student_id}
                    onChange={(e) => setForm({ ...form, student_id: e.target.value.toUpperCase() })}
                    placeholder="e.g. STU2026CS0501"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Student Name"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Batch Year *</label>
                  <input
                    type="number"
                    required
                    min="2018"
                    max="2032"
                    value={form.batch_year}
                    onChange={(e) => setForm({ ...form, batch_year: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="student@college.edu"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              {/* Section 3: Academic & Readiness Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold mb-1">CGPA (0–10) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    value={form.cgpa}
                    onChange={(e) => setForm({ ...form, cgpa: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">10th % *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={form.tenth_percent}
                    onChange={(e) => setForm({ ...form, tenth_percent: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">12th % *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={form.twelfth_percent}
                    onChange={(e) => setForm({ ...form, twelfth_percent: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Coding Score *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    required
                    value={form.coding_score}
                    onChange={(e) => setForm({ ...form, coding_score: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={form.active_backlogs}
                    onChange={(e) => setForm({ ...form, active_backlogs: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Internships</label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={form.internships_count}
                    onChange={(e) => setForm({ ...form, internships_count: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Projects</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={form.projects_count}
                    onChange={(e) => setForm({ ...form, projects_count: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              {/* Section 4: Skills */}
              <div>
                <label className="block font-semibold mb-1.5">Technical Skills *</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_SKILLS.map((sk) => {
                    const active = form.skills.includes(sk);
                    return (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => toggleFormSkill(sk)}
                        className={`px-2.5 py-1 rounded-lg border transition ${
                          active
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {sk}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 5: Placement Status */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-3">
                <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.placement_status}
                    onChange={(e) => setForm({ ...form, placement_status: e.target.checked })}
                    className="rounded accent-indigo-600"
                  />
                  Student is Placed
                </label>

                {form.placement_status && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Company Name</label>
                      <input
                        type="text"
                        required
                        value={form.company_name === 'None' ? '' : form.company_name}
                        onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                        placeholder="e.g. Amazon"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Company Tier</label>
                      <select
                        value={form.company_tier === 'None' ? 'Tier-1 Product' : form.company_tier}
                        onChange={(e) => setForm({ ...form, company_tier: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                      >
                        <option value="Tier-1 Product">Tier-1 Product</option>
                        <option value="Tier-2 Service">Tier-2 Service</option>
                        <option value="Core">Core</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">CTC (LPA)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="100"
                        required
                        value={form.ctc_lpa}
                        onChange={(e) => setForm({ ...form, ctc_lpa: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
