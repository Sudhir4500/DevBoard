"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { projectService } from "@/services/projectService";
import { issueService } from "@/services/issueService";
import type { Project, Issue, IssuePriority, IssueStatus } from "@/types/domain";
import type { ProjectCreateInput } from "@/types/project";
import type { IssueCreateInput, IssueUpdateInput } from "@/types/issue";
import { getDisplayMessage } from "@/lib/errors";
import type { ErrorResponse } from "@/types/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLUMNS: Array<{ value: IssueStatus; label: string }> = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

const PRIORITY_OPTIONS: IssuePriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const STATUS_STYLES: Record<IssueStatus, { badge: string; dot: string }> = {
  BACKLOG:     { badge: "bg-[#8c9bab1f] text-[#8c9bab]",       dot: "bg-[#8c9bab]" },
  TODO:        { badge: "bg-[#0c66e41a] text-[#579dff]",       dot: "bg-[#579dff]" },
  IN_PROGRESS: { badge: "bg-[#e2812d1a] text-[#e2812d]",       dot: "bg-[#e2812d]" },
  DONE:        { badge: "bg-[#22a06b1a] text-[#22a06b]",       dot: "bg-[#22a06b]" },
};

const PRIORITY_STYLES: Record<IssuePriority, { color: string; icon: string }> = {
  LOW:    { color: "text-[#22a06b]", icon: "↓" },
  MEDIUM: { color: "text-[#e2812d]", icon: "=" },
  HIGH:   { color: "text-[#e2483d]", icon: "↑" },
  URGENT: { color: "text-[#e2483d]", icon: "!!" },
};

const ISSUE_TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  task:  { bg: "bg-[#0c66e41a]", text: "text-[#4a90e2]", label: "Task" },
  story: { bg: "bg-[#22a06b1a]", text: "text-[#22a06b]", label: "Story" },
  bug:   { bg: "bg-[#e2483d1a]", text: "text-[#e2483d]", label: "Bug" },
  epic:  { bg: "bg-[#8270db1a]", text: "text-[#8270db]", label: "Epic" },
};

type IssueType = "task" | "story" | "bug" | "epic";
type ViewMode = "list" | "board";
type PageMode = "backlog" | "board" | "timeline";

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypeIcon({ type, size = "sm" }: { type: IssueType; size?: "sm" | "md" }) {
  const style = ISSUE_TYPE_STYLES[type] ?? ISSUE_TYPE_STYLES.task;
  const dim = size === "md" ? "w-5 h-5 text-xs" : "w-4 h-4 text-[10px]";
  const symbols: Record<IssueType, string> = { task: "✓", story: "▶", bug: "⬟", epic: "⚡" };
  return (
    <span className={`inline-flex items-center justify-center rounded ${dim} ${style.bg} ${style.text} font-bold flex-shrink-0`}>
      {symbols[type]}
    </span>
  );
}

function StatusBadge({ status }: { status: IssueStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center h-5 px-2 rounded text-[11px] font-semibold uppercase tracking-wider ${s.badge}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function PriorityCell({ priority }: { priority: IssuePriority }) {
  const s = PRIORITY_STYLES[priority];
  return (
    <span className={`text-sm font-bold ${s.color}`} title={priority}>
      {s.icon} <span className="text-xs font-semibold">{priority}</span>
    </span>
  );
}

function Avatar({ initials, size = 24 }: { initials: string; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-[#7380c0] text-white font-semibold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

function UnassignedAvatar({ size = 24 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full border-[1.5px] border-dashed border-[#a6c5e229] text-[#596773] flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      +
    </span>
  );
}

// ─── Issue Detail Modal ───────────────────────────────────────────────────────

interface IssueModalProps {
  issue: Issue & { type?: IssueType };
  onClose: () => void;
  onStatusChange: (id: string, status: IssueStatus) => void;
}

function IssueModal({ issue, onClose, onStatusChange }: IssueModalProps) {
  const type: IssueType = issue.type ?? "task";
  const statusStyle = STATUS_STYLES[issue.status];
  const priorityStyle = PRIORITY_STYLES[issue.priority];

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-12"
      onClick={onClose}
    >
      <div
        className="bg-[#282e33] border border-[#a6c5e229] rounded-xl w-[90%] max-w-[860px] max-h-[calc(100vh-80px)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal top bar */}
        <div className="h-10 px-4 flex items-center gap-2 border-b border-[#a6c5e229] flex-shrink-0">
          <span className="text-[#579dff] text-sm font-medium">{issue.id ?? "DEV-?"}</span>
          <span className="text-[#596773] text-sm">/ DevBoard</span>
          <div className="ml-auto flex gap-1">
            {["🔗", "👁", "•••"].map((icon, i) => (
              <button key={i} className="w-7 h-7 rounded text-[#8c9bab] hover:bg-white/10 text-xs flex items-center justify-center">
                {icon}
              </button>
            ))}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded text-[#8c9bab] hover:bg-white/10 flex items-center justify-center text-base"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel */}
          <div className="flex-1 overflow-y-auto p-6">
            <h1 className="text-xl font-semibold text-white leading-snug mb-4">{issue.title}</h1>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <TypeIcon type={type} size="md" />
              <StatusBadge status={issue.status} />
              <span className="text-xs text-[#596773] bg-[#22272b] px-2 py-0.5 rounded">
                Sprint 3
              </span>
            </div>

            {/* Quick-action buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              {["📎 Attach", "🔗 Link issue", "⊕ Create subtask"].map((label) => (
                <button key={label} className="h-8 px-3 rounded text-[#c7d1db] text-sm hover:bg-white/10 border border-[#a6c5e229]">
                  {label}
                </button>
              ))}
            </div>

            {/* Description */}
            <p className="text-[11px] font-semibold text-[#596773] uppercase tracking-widest mb-2">Description</p>
            <div className="text-sm text-[#8c9bab] leading-relaxed bg-[#1d21251a] border border-transparent hover:border-[#a6c5e229] rounded p-3 cursor-text min-h-[80px]">
              {issue.description ?? (
                <span className="text-[#596773] italic">
                  Add a description to capture more context about what needs to be done.
                </span>
              )}
            </div>

            {/* Child issues */}
            <p className="text-[11px] font-semibold text-[#596773] uppercase tracking-widest mt-6 mb-2">Child issues</p>
            <button className="w-full border border-dashed border-[#a6c5e229] rounded text-[#596773] text-sm py-2 px-3 hover:bg-white/5 flex items-center gap-2">
              + Add child issue
            </button>

            {/* Activity */}
            <p className="text-[11px] font-semibold text-[#596773] uppercase tracking-widest mt-6 mb-3">Activity</p>
            <div className="flex gap-2 mb-4">
              {["All", "Comments", "History"].map((tab, i) => (
                <button
                  key={tab}
                  className={`h-7 px-3 rounded text-xs font-medium border ${
                    i === 0
                      ? "bg-[#1d7afc1a] text-[#579dff] border-[#0c66e433]"
                      : "bg-transparent text-[#8c9bab] border-transparent hover:bg-white/10"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <p className="text-sm text-[#596773] pb-4">No activity yet.</p>

            {/* Comment box */}
            <div className="flex gap-3 mt-2">
              <Avatar initials="SS" size={32} />
              <div className="flex-1 border border-[#a6c5e229] rounded overflow-hidden">
                <textarea
                  className="w-full bg-transparent border-none p-3 text-[#c7d1db] text-sm resize-none outline-none placeholder:text-[#596773]"
                  placeholder="Add a comment..."
                  rows={2}
                />
                <div className="flex justify-end gap-2 px-2 pb-2 border-t border-[#a6c5e229] pt-2">
                  <button className="h-7 px-3 text-[#c7d1db] text-xs rounded hover:bg-white/10">Cancel</button>
                  <button className="h-7 px-3 bg-[#0c66e4] hover:bg-[#0055cc] text-white text-xs rounded font-medium">Save</button>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="w-[280px] border-l border-[#a6c5e229] overflow-y-auto p-5 flex-shrink-0">
            {/* Status select */}
            <div className="mb-5">
              <select
                value={issue.status}
                onChange={(e) => onStatusChange(issue.id!, e.target.value as IssueStatus)}
                className={`w-full bg-[#1d2125] border border-[#a6c5e229] rounded px-3 py-2 text-sm font-semibold outline-none cursor-pointer ${statusStyle.badge}`}
              >
                {STATUS_COLUMNS.map((s) => (
                  <option key={s.value} value={s.value} className="bg-[#282e33] text-[#c7d1db]">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Detail rows */}
            {[
              {
                label: "Assignee",
                value: (
                  <div className="flex items-center gap-2">
                    {issue.assignee_id ? <Avatar initials="SS" size={20} /> : <UnassignedAvatar size={20} />}
                    <span className={issue.assignee_id ? "text-[#c7d1db]" : "text-[#596773]"}>
                      {issue.assignee_id ? "Sudhir Sharma" : "Unassigned"}
                    </span>
                  </div>
                ),
              },
              {
                label: "Priority",
                value: (
                  <span className={`font-semibold ${priorityStyle.color}`}>
                    {priorityStyle.icon} {issue.priority}
                  </span>
                ),
              },
              {
                label: "Reporter",
                value: (
                  <div className="flex items-center gap-2">
                    <Avatar initials="SS" size={20} />
                    <span>Sudhir Sharma</span>
                  </div>
                ),
              },
              { label: "Labels",  value: <span className="text-[#596773]">+ None</span> },
              { label: "Sprint",  value: <span>Sprint 3</span> },
              { label: "Points",  value: <span>—</span> },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center mb-3">
                <span className="w-[110px] text-xs text-[#596773] flex-shrink-0">{label}</span>
                <div className="flex items-center gap-1.5 text-sm text-[#c7d1db] cursor-pointer px-1.5 py-1 rounded hover:bg-white/10 flex-1">
                  {value}
                </div>
              </div>
            ))}

            <div className="border-t border-[#a6c5e229] my-3" />
            <div className="text-xs text-[#596773] space-y-1">
              <div>Created <span className="text-[#8c9bab]">recently</span></div>
              <div>Updated <span className="text-[#8c9bab]">recently</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create Issue Modal ───────────────────────────────────────────────────────

interface CreateIssueModalProps {
  projects: Project[];
  selectedProjectId: string;
  onClose: () => void;
  onSubmit: (payload: IssueCreateInput) => Promise<void>;
  isSaving: boolean;
  error: string | null;
}

function CreateIssueModal({
  projects,
  selectedProjectId,
  onClose,
  onSubmit,
  isSaving,
  error,
}: CreateIssueModalProps) {
  const [form, setForm] = useState<IssueCreateInput>({
    title: "",
    description: null,
    status: "TODO",
    priority: "MEDIUM",
    project_id: selectedProjectId,
    assignee_id: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await onSubmit({
      ...form,
      title: form.title.trim(),
      description: form.description?.trim() || null,
      assignee_id: form.assignee_id?.trim() || null,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-12"
      onClick={onClose}
    >
      <div
        className="bg-[#282e33] border border-[#a6c5e229] rounded-xl w-[90%] max-w-[580px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">Create issue</h2>
          <button onClick={onClose} className="w-7 h-7 rounded text-[#8c9bab] hover:bg-white/10 flex items-center justify-center">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#8c9bab] mb-1.5">
              Project <span className="text-[#e2483d]">*</span>
            </label>
            <select
              value={form.project_id}
              onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))}
              className="w-full bg-[#1d2125] border border-[#a6c5e229] rounded px-3 py-2 text-sm text-[#c7d1db] outline-none focus:border-[#0c66e4]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#282e33]">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8c9bab] mb-1.5">Issue type</label>
              <select className="w-full bg-[#1d2125] border border-[#a6c5e229] rounded px-3 py-2 text-sm text-[#c7d1db] outline-none focus:border-[#0c66e4]">
                <option className="bg-[#282e33]">Task</option>
                <option className="bg-[#282e33]">Story</option>
                <option className="bg-[#282e33]">Bug</option>
                <option className="bg-[#282e33]">Epic</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8c9bab] mb-1.5">Sprint</label>
              <select className="w-full bg-[#1d2125] border border-[#a6c5e229] rounded px-3 py-2 text-sm text-[#c7d1db] outline-none focus:border-[#0c66e4]">
                <option className="bg-[#282e33]">Sprint 3 (active)</option>
                <option className="bg-[#282e33]">Backlog</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8c9bab] mb-1.5">
              Summary <span className="text-[#e2483d]">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="What needs to be done?"
              className="w-full bg-[#1d2125] border border-[#a6c5e229] rounded px-3 py-2 text-sm text-[#c7d1db] outline-none focus:border-[#0c66e4] placeholder:text-[#596773]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8c9bab] mb-1.5">Description</label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Add more context..."
              rows={3}
              className="w-full bg-[#1d2125] border border-[#a6c5e229] rounded px-3 py-2 text-sm text-[#c7d1db] outline-none focus:border-[#0c66e4] resize-y placeholder:text-[#596773]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8c9bab] mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as IssueStatus }))}
                className="w-full bg-[#1d2125] border border-[#a6c5e229] rounded px-3 py-2 text-sm text-[#c7d1db] outline-none focus:border-[#0c66e4]"
              >
                {STATUS_COLUMNS.map((s) => (
                  <option key={s.value} value={s.value} className="bg-[#282e33]">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8c9bab] mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as IssuePriority }))}
                className="w-full bg-[#1d2125] border border-[#a6c5e229] rounded px-3 py-2 text-sm text-[#c7d1db] outline-none focus:border-[#0c66e4]"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p} className="bg-[#282e33]">
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8c9bab] mb-1.5">Assignee UUID (optional)</label>
            <input
              type="text"
              value={form.assignee_id ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, assignee_id: e.target.value || null }))}
              placeholder="Optional UUID"
              className="w-full bg-[#1d2125] border border-[#a6c5e229] rounded px-3 py-2 text-sm text-[#c7d1db] outline-none focus:border-[#0c66e4] placeholder:text-[#596773]"
            />
          </div>

          {error && <p className="text-sm text-[#e2483d]">{error}</p>}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#a6c5e229]">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-4 rounded text-[#c7d1db] text-sm hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !form.title.trim()}
              className="h-8 px-4 rounded bg-[#0c66e4] hover:bg-[#0055cc] text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Kanban Board ─────────────────────────────────────────────────────────────

interface KanbanBoardProps {
  groupedIssues: Record<IssueStatus, (Issue & { type?: IssueType })[]>;
  onIssueClick: (issue: Issue) => void;
  onCreateClick: () => void;
}

function KanbanBoard({ groupedIssues, onIssueClick, onCreateClick }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {STATUS_COLUMNS.map((col) => {
        const colIssues = groupedIssues[col.value];
        return (
          <div key={col.value} className="bg-[#22272b] rounded-xl overflow-hidden">
            <div className="px-3 py-2.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8c9bab] uppercase tracking-wider">{col.label}</span>
              <span className="text-xs text-[#596773]">{colIssues.length}</span>
            </div>
            <div className="px-2 pb-2 flex flex-col gap-1.5 min-h-12">
              {colIssues.map((issue) => {
                const type: IssueType = issue.type ?? "task";
                const pStyle = PRIORITY_STYLES[issue.priority];
                return (
                  <article
                    key={issue.id}
                    onClick={() => onIssueClick(issue)}
                    className="bg-[#22272b] border border-[#a6c5e229] rounded p-2.5 cursor-pointer hover:bg-[#282e33] hover:border-[#a1bdd940]"
                  >
                    <p className="text-[13px] text-[#c7d1db] leading-snug mb-2">{issue.title}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <TypeIcon type={type} />
                        <span className="text-[11px] text-[#596773] font-mono">{issue.id ?? "—"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${pStyle.color}`}>{pStyle.icon}</span>
                        {issue.assignee_id ? <Avatar initials="SS" size={20} /> : <UnassignedAvatar size={20} />}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <button
              onClick={onCreateClick}
              className="w-full px-3 py-2 text-[13px] text-[#596773] hover:text-[#c7d1db] hover:bg-white/5 flex items-center gap-1.5"
            >
              + Add issue
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Backlog Table ────────────────────────────────────────────────────────────

interface BacklogTableProps {
  label: string;
  issues: (Issue & { type?: IssueType })[];
  doneCount: number;
  isActive?: boolean;
  onIssueClick: (issue: Issue) => void;
  onCreateClick: () => void;
}

function BacklogTable({ label, issues, doneCount, isActive = false, onIssueClick, onCreateClick }: BacklogTableProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="mb-6">
      {/* Sprint header */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-[#8c9bab] hover:text-[#c7d1db] text-sm"
        >
          {collapsed ? "▶" : "▼"}
        </button>
        <span className="text-sm font-semibold text-white">{label}</span>
        <span className="text-xs text-[#22a06b] bg-[#22a06b1a] px-2 py-0.5 rounded-full">
          {doneCount}/{issues.length} done
        </span>
        <div className="ml-auto">
          {isActive ? (
            <button className="h-7 px-3 bg-[#0c66e4] hover:bg-[#0055cc] text-white text-xs rounded font-medium flex items-center gap-1">
              ▶ Complete sprint
            </button>
          ) : (
            <button className="h-7 px-3 border border-[#a6c5e229] text-[#c7d1db] text-xs rounded hover:bg-white/10 flex items-center gap-1">
              + Start sprint
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="border border-[#a6c5e229] rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-[11px] font-semibold text-[#596773] uppercase tracking-wider px-3 py-2 border-b border-[#a6c5e215] text-left w-24">
                  Key
                </th>
                <th className="text-[11px] font-semibold text-[#596773] uppercase tracking-wider px-3 py-2 border-b border-[#a6c5e215] text-left">
                  Summary
                </th>
                <th className="text-[11px] font-semibold text-[#596773] uppercase tracking-wider px-3 py-2 border-b border-[#a6c5e215] text-left w-32">
                  Status
                </th>
                <th className="text-[11px] font-semibold text-[#596773] uppercase tracking-wider px-3 py-2 border-b border-[#a6c5e215] text-left w-24">
                  Priority
                </th>
                <th className="text-[11px] font-semibold text-[#596773] uppercase tracking-wider px-3 py-2 border-b border-[#a6c5e215] text-center w-10">
                  Pts
                </th>
                <th className="text-[11px] font-semibold text-[#596773] uppercase tracking-wider px-3 py-2 border-b border-[#a6c5e215] text-center w-10">
                  Who
                </th>
              </tr>
            </thead>
            <tbody>
              {issues.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-sm text-[#596773]">
                    No issues in this sprint
                  </td>
                </tr>
              )}
              {issues.map((issue) => {
                const type: IssueType = issue.type ?? "task";
                return (
                  <tr
                    key={issue.id}
                    onClick={() => onIssueClick(issue)}
                    className="cursor-pointer hover:bg-white/[0.03] border-b border-[#a6c5e215] last:border-0"
                  >
                    <td className="px-3 py-0 h-10">
                      <span className="text-xs text-[#8c9bab] font-mono">{issue.id ?? "—"}</span>
                    </td>
                    <td className="px-3 py-0 h-10">
                      <div className="flex items-center gap-2">
                        <TypeIcon type={type} />
                        <span className="text-[13px] text-[#c7d1db] truncate max-w-sm">{issue.title}</span>
                      </div>
                    </td>
                    <td className="px-3 py-0 h-10">
                      <StatusBadge status={issue.status} />
                    </td>
                    <td className="px-3 py-0 h-10">
                      <PriorityCell priority={issue.priority} />
                    </td>
                    <td className="px-3 py-0 h-10 text-center text-sm text-[#8c9bab]">—</td>
                    <td className="px-3 py-0 h-10 text-center">
                      {issue.assignee_id ? <Avatar initials="SS" size={24} /> : <UnassignedAvatar size={24} />}
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan={6} className="px-3 py-1.5">
                  <button
                    onClick={onCreateClick}
                    className="text-[13px] text-[#596773] hover:text-[#c7d1db] flex items-center gap-1.5 py-1"
                  >
                    + Create issue
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Left Nav ─────────────────────────────────────────────────────────────────

interface LeftNavProps {
  page: PageMode;
  onPageChange: (p: PageMode) => void;
  projects: Project[];
  selectedProjectId: string;
  onProjectSelect: (id: string) => void;
  onCreateClick: () => void;
}

function LeftNav({ page, onPageChange, projects, selectedProjectId, onProjectSelect, onCreateClick }: LeftNavProps) {
  const navItems: Array<{ id: PageMode; label: string; icon: string }> = [
    { id: "board",    label: "Board",    icon: "▦" },
    { id: "backlog",  label: "Backlog",  icon: "☰" },
    { id: "timeline", label: "Timeline", icon: "⊟" },
  ];

  return (
    <nav className="w-[220px] bg-[#1d2125] border-r border-[#a6c5e229] flex flex-col overflow-y-auto flex-shrink-0 pb-4">
      <div className="px-2 pt-4 pb-1">
        <p className="text-[11px] font-semibold text-[#596773] uppercase tracking-widest px-2 mb-1">Planning</p>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-[13px] text-left ${
              page === item.id ? "bg-[#1d7afc1a] text-[#579dff]" : "text-[#c7d1db] hover:bg-white/[0.05]"
            }`}
          >
            <span className="w-5 text-center flex-shrink-0">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      <div className="h-px bg-[#a6c5e229] mx-4 my-3" />

      <div className="px-2">
        <p className="text-[11px] font-semibold text-[#596773] uppercase tracking-widest px-2 mb-1">Projects</p>
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onProjectSelect(project.id)}
            className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-[13px] text-left ${
              selectedProjectId === project.id ? "bg-[#1d7afc1a] text-[#579dff]" : "text-[#c7d1db] hover:bg-white/[0.05]"
            }`}
          >
            <span className="w-5 h-5 rounded bg-gradient-to-br from-[#0c66e4] to-[#7380c0] flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
              {project.name.charAt(0).toUpperCase()}
            </span>
            <span className="truncate">{project.name}</span>
          </button>
        ))}
      </div>

      <div className="h-px bg-[#a6c5e229] mx-4 my-3" />

      <div className="px-2">
        <button
          onClick={onCreateClick}
          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-[13px] text-left text-[#579dff] hover:bg-white/[0.05]"
        >
          <span className="w-5 text-center">+</span> Create issue
        </button>
      </div>
    </nav>
  );
}

// ─── Project Summary Card ─────────────────────────────────────────────────────

function ProjectSummaryCard({
  project,
  issues,
  onDelete,
}: {
  project: Project | null;
  issues: Issue[];
  onDelete: (id: string) => void;
}) {
  if (!project) return null;
  const done = issues.filter((i) => i.status === "DONE").length;
  const inProgress = issues.filter((i) => i.status === "IN_PROGRESS").length;
  const todo = issues.filter((i) => i.status === "TODO").length;
  const pct = issues.length ? Math.round((done / issues.length) * 100) : 0;

  return (
    <div className="bg-[#22272b] rounded-xl px-5 py-4 mb-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#0c66e4] to-[#7380c0] flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
        {project.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-white truncate">{project.name}</h1>
        <p className="text-sm text-[#8c9bab] truncate">{project.description ?? "Software project · Scrum"}</p>
        <div className="mt-2">
          <p className="text-xs text-[#596773] mb-1">
            {done} of {issues.length} issues done · {pct}%
          </p>
          <div className="h-1.5 bg-[#a1bdd914] rounded-full overflow-hidden w-60">
            <div className="h-full bg-[#22a06b] rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      <div className="flex gap-5 flex-shrink-0">
        {[
          { n: todo,       label: "To Do" },
          { n: inProgress, label: "In Progress" },
          { n: done,       label: "Done" },
        ].map(({ n, label }) => (
          <div key={label} className="text-center">
            <div className="text-xl font-bold text-white">{n}</div>
            <div className="text-[11px] text-[#596773] uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>
      <button
        onClick={() => onDelete(project.id)}
        className="ml-2 h-8 px-3 rounded border border-[#e2483d33] bg-[#e2483d1a] text-[#e2483d] text-xs hover:bg-[#e2483d29] flex-shrink-0"
      >
        Delete
      </button>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardView() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [projects, setProjects]               = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [issues, setIssues]                   = useState<Issue[]>([]);
  const [page, setPage]                       = useState<PageMode>("backlog");
  const [viewMode, setViewMode]               = useState<ViewMode>("list");
  const [search, setSearch]                   = useState("");

  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingIssues, setIsLoadingIssues]     = useState(false);
  const [isSavingIssue, setIsSavingIssue]         = useState(false);
  const [projectError, setProjectError]           = useState<string | null>(null);
  const [issueError, setIssueError]               = useState<string | null>(null);
  const [globalMessage, setGlobalMessage]         = useState<string | null>(null);

  const [openIssue, setOpenIssue]       = useState<Issue | null>(null);
  const [showCreate, setShowCreate]     = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectForm, setProjectForm]   = useState<ProjectCreateInput>({ name: "", description: "" });
  const [isSavingProject, setIsSavingProject] = useState(false);

  // Load projects
  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      setIsLoadingProjects(true);
      const res = await projectService.listProjects();
      if (res.success) {
        setProjects(res.data);
        setSelectedProjectId((cur) => {
          const exists = res.data.some((p) => p.id === cur);
          return exists ? cur : res.data[0]?.id ?? "";
        });
      } else {
        setProjectError(getDisplayMessage(res as ErrorResponse));
      }
      setIsLoadingProjects(false);
    };
    void load();
  }, [isAuthenticated]);

  // Load issues for selected project
  useEffect(() => {
    if (!selectedProjectId) return;
    const load = async () => {
      setIsLoadingIssues(true);
      const res = await issueService.listProjectIssues(selectedProjectId);
      if (res.success) setIssues(res.data);
      else setIssueError(getDisplayMessage(res as ErrorResponse));
      setIsLoadingIssues(false);
    };
    void load();
  }, [selectedProjectId]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const filteredIssues = useMemo(
    () =>
      search
        ? issues.filter(
            (i) =>
              i.title.toLowerCase().includes(search.toLowerCase()) ||
              i.id?.toLowerCase().includes(search.toLowerCase())
          )
        : issues,
    [issues, search]
  );

  const groupedIssues = useMemo(
    () =>
      STATUS_COLUMNS.reduce<Record<IssueStatus, Issue[]>>(
        (acc, col) => {
          acc[col.value] = filteredIssues.filter((i) => i.status === col.value);
          return acc;
        },
        { BACKLOG: [], TODO: [], IN_PROGRESS: [], DONE: [] }
      ),
    [filteredIssues]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const handleCreateIssue = useCallback(
    async (payload: IssueCreateInput) => {
      setIsSavingIssue(true);
      setIssueError(null);
      const res = await issueService.createIssue(payload);
      if (res.success) {
        setIssues((cur) => [res.data, ...cur]);
        setShowCreate(false);
        setGlobalMessage("Issue created.");
      } else {
        setIssueError(getDisplayMessage(res as ErrorResponse));
      }
      setIsSavingIssue(false);
    },
    []
  );

  const handleStatusChange = useCallback(
    async (issueId: string, status: IssueStatus) => {
      const res = await issueService.updateIssue(issueId, { status } as IssueUpdateInput);
      if (res.success) {
        setIssues((cur) => cur.map((i) => (i.id === issueId ? res.data : i)));
        if (openIssue?.id === issueId) setOpenIssue(res.data);
      } else {
        setIssueError(getDisplayMessage(res as ErrorResponse));
      }
    },
    [openIssue]
  );

  const handleProjectCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProject(true);
    const res = await projectService.createProject({
      name: projectForm.name.trim(),
      description: projectForm.description?.trim() || null,
    });
    if (res.success) {
      setProjects((cur) => [res.data, ...cur]);
      setSelectedProjectId(res.data.id);
      setProjectForm({ name: "", description: "" });
      setShowNewProject(false);
      setGlobalMessage("Project created.");
    } else {
      setProjectError(getDisplayMessage(res as ErrorResponse));
    }
    setIsSavingProject(false);
  };

  const handleProjectDelete = async (projectId: string) => {
    if (!window.confirm("Delete this project and all its issues?")) return;
    const res = await projectService.deleteProject(projectId);
    if (res.success) {
      setProjects((cur) => {
        const remaining = cur.filter((p) => p.id !== projectId);
        setSelectedProjectId((sel) => (sel !== projectId ? sel : remaining[0]?.id ?? ""));
        return remaining;
      });
      setGlobalMessage("Project deleted.");
    } else {
      setProjectError(getDisplayMessage(res as ErrorResponse));
    }
  };

  // ── Loading screen ────────────────────────────────────────────────────────

  if (isLoading || isLoadingProjects) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1d2125] text-[#c7d1db]">
        <div className="border border-[#a6c5e229] bg-[#22272b] px-6 py-4 rounded-xl text-sm text-[#8c9bab]">
          Loading workspace...
        </div>
      </div>
    );
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#1d2125] text-[#c7d1db] flex flex-col">

      {/* ── Top nav ── */}
      <header className="h-12 bg-[#1d2125] border-b border-[#a6c5e229] flex items-center px-3 gap-1 flex-shrink-0 z-10">
        <div className="w-7 h-7 bg-[#0c66e4] rounded flex items-center justify-center text-white text-xs font-black mr-1 flex-shrink-0">
          D
        </div>
        {["Your work", "Projects", "Teams", "Plans"].map((label, i) => (
          <button
            key={label}
            onClick={() => i === 1 && setShowNewProject((v) => !v)}
            className="h-8 px-2 rounded text-[13px] text-[#c7d1db] hover:bg-white/[0.08] flex items-center gap-1"
          >
            {label}
          </button>
        ))}

        {/* Search */}
        <div className="h-8 w-64 bg-[#22272b] border border-[#a6c5e229] rounded flex items-center gap-2 px-3 ml-2">
          <span className="text-[#596773] text-xs">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search issues…"
            className="bg-transparent border-none outline-none text-[13px] text-[#c7d1db] placeholder:text-[#596773] w-full"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="http://localhost:8000/api/v1/docs"
            target="_blank"
            className="h-8 px-3 rounded border border-[#a6c5e229] text-xs text-[#c7d1db] hover:bg-white/10 hidden lg:flex items-center"
          >
            API Docs
          </Link>
          <button
            onClick={handleLogout}
            className="h-8 px-3 rounded border border-[#a6c5e229] text-xs text-[#c7d1db] hover:bg-white/10"
          >
            Sign out
          </button>
          <div className="hidden sm:block text-right mr-1">
            <div className="text-xs font-semibold text-white leading-none">{user?.full_name}</div>
            <div className="text-[11px] text-[#596773]">{user?.email}</div>
          </div>
          <Avatar initials={(user?.full_name ?? "U").slice(0, 2).toUpperCase()} size={28} />
        </div>
      </header>

      {/* ── Global message ── */}
      {globalMessage && (
        <div className="mx-auto w-full max-w-7xl px-4 pt-3">
          <div className="bg-[#22a06b1a] border border-[#22a06b33] text-[#22a06b] text-sm px-4 py-2 rounded-lg flex items-center justify-between">
            {globalMessage}
            <button onClick={() => setGlobalMessage(null)} className="text-[#22a06b] text-xs ml-4 opacity-70 hover:opacity-100">✕</button>
          </div>
        </div>
      )}

      {/* ── App body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left nav */}
        <LeftNav
          page={page}
          onPageChange={setPage}
          projects={projects}
          selectedProjectId={selectedProjectId}
          onProjectSelect={setSelectedProjectId}
          onCreateClick={() => setShowCreate(true)}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-[#1d2125]">
          <div className="max-w-7xl mx-auto px-6 py-6">

            {/* Project summary */}
            <ProjectSummaryCard
              project={selectedProject}
              issues={filteredIssues}
              onDelete={handleProjectDelete}
            />

            {/* New project form (inline panel) */}
            {showNewProject && (
              <div className="bg-[#22272b] border border-[#a6c5e229] rounded-xl p-5 mb-5">
                <h2 className="text-sm font-semibold text-white mb-4">New project</h2>
                <form onSubmit={handleProjectCreate} className="flex flex-col gap-3">
                  <input
                    value={projectForm.name}
                    onChange={(e) => setProjectForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Project name"
                    className="bg-[#1d2125] border border-[#a6c5e229] rounded px-3 py-2 text-sm text-[#c7d1db] outline-none focus:border-[#0c66e4] placeholder:text-[#596773]"
                    required
                  />
                  <textarea
                    value={projectForm.description ?? ""}
                    onChange={(e) => setProjectForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Description (optional)"
                    rows={2}
                    className="bg-[#1d2125] border border-[#a6c5e229] rounded px-3 py-2 text-sm text-[#c7d1db] outline-none focus:border-[#0c66e4] resize-none placeholder:text-[#596773]"
                  />
                  {projectError && <p className="text-sm text-[#e2483d]">{projectError}</p>}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSavingProject || !projectForm.name.trim()}
                      className="h-8 px-4 bg-[#0c66e4] hover:bg-[#0055cc] text-white text-sm rounded disabled:opacity-50"
                    >
                      {isSavingProject ? "Creating…" : "Create project"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewProject(false)}
                      className="h-8 px-4 border border-[#a6c5e229] text-[#c7d1db] text-sm rounded hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Page header + toolbar */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-semibold text-white capitalize">
                  {page === "backlog" ? "Backlog" : page === "board" ? "Board" : "Timeline"}
                </h1>
                <p className="text-sm text-[#8c9bab]">
                  {selectedProject?.name ?? "No project"} · {filteredIssues.length} issues
                </p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="h-8 px-3 bg-[#0c66e4] hover:bg-[#0055cc] text-white text-sm rounded flex items-center gap-1.5"
              >
                + Create issue
              </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <button className="h-8 px-3 rounded border border-transparent text-[#8c9bab] text-[13px] hover:bg-white/[0.05] flex items-center gap-1.5">
                👤 Assignee
              </button>
              <button className="h-8 px-3 rounded border border-transparent text-[#8c9bab] text-[13px] hover:bg-white/[0.05] flex items-center gap-1.5">
                🏷 Label
              </button>
              <button className="h-8 px-3 rounded border border-transparent text-[#8c9bab] text-[13px] hover:bg-white/[0.05] flex items-center gap-1.5">
                ⚡ Epic
              </button>

              {/* View toggle (only on backlog page) */}
              {page === "backlog" && (
                <div className="ml-auto flex gap-0.5 bg-[#22272b] rounded p-0.5">
                  {(["list", "board"] as ViewMode[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setViewMode(v)}
                      className={`w-8 h-7 rounded text-sm flex items-center justify-center ${
                        viewMode === v ? "bg-[#1d2125] text-[#579dff]" : "text-[#8c9bab]"
                      }`}
                      title={v === "list" ? "List view" : "Board view"}
                    >
                      {v === "list" ? "☰" : "▦"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isLoadingIssues && (
              <p className="text-sm text-[#596773] mb-4">Loading issues…</p>
            )}

            {/* ── Page: Backlog ── */}
            {page === "backlog" && viewMode === "list" && (
              <>
                <BacklogTable
                  label="Sprint 3 · Jun 1 – Jun 14, 2026"
                  issues={filteredIssues.filter((i) => i.status !== "BACKLOG")}
                  doneCount={filteredIssues.filter((i) => i.status === "DONE").length}
                  isActive
                  onIssueClick={setOpenIssue}
                  onCreateClick={() => setShowCreate(true)}
                />
                <BacklogTable
                  label="Backlog"
                  issues={filteredIssues.filter((i) => i.status === "BACKLOG")}
                  doneCount={0}
                  onIssueClick={setOpenIssue}
                  onCreateClick={() => setShowCreate(true)}
                />
              </>
            )}

            {page === "backlog" && viewMode === "board" && (
              <KanbanBoard
                groupedIssues={groupedIssues}
                onIssueClick={setOpenIssue}
                onCreateClick={() => setShowCreate(true)}
              />
            )}

            {/* ── Page: Board ── */}
            {page === "board" && (
              <KanbanBoard
                groupedIssues={groupedIssues}
                onIssueClick={setOpenIssue}
                onCreateClick={() => setShowCreate(true)}
              />
            )}

            {/* ── Page: Timeline ── */}
            {page === "timeline" && (
              <div className="flex flex-col items-center justify-center py-24 text-[#596773]">
                <span className="text-5xl mb-4">⊟</span>
                <p className="text-lg font-medium">Timeline view coming soon</p>
                <p className="text-sm mt-1">Gantt-style issue planning</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Modals ── */}
      {openIssue && (
        <IssueModal
          issue={openIssue}
          onClose={() => setOpenIssue(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {showCreate && (
        <CreateIssueModal
          projects={projects}
          selectedProjectId={selectedProjectId}
          onClose={() => { setShowCreate(false); setIssueError(null); }}
          onSubmit={handleCreateIssue}
          isSaving={isSavingIssue}
          error={issueError}
        />
      )}
    </div>
  );
}