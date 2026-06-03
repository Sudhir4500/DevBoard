"use client";

import { useEffect, useMemo, useState } from "react";
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

const STATUS_COLUMNS: Array<{ value: IssueStatus; label: string }> = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

const PRIORITY_OPTIONS: IssuePriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const STATUS_BADGE: Record<IssueStatus, string> = {
  BACKLOG: "bg-slate-500/15 text-slate-200 border-slate-500/20",
  TODO: "bg-blue-500/15 text-blue-200 border-blue-500/20",
  IN_PROGRESS: "bg-amber-500/15 text-amber-200 border-amber-500/20",
  DONE: "bg-emerald-500/15 text-emerald-200 border-emerald-500/20",
};

const PRIORITY_BADGE: Record<IssuePriority, string> = {
  LOW: "bg-emerald-500/15 text-emerald-200 border-emerald-500/20",
  MEDIUM: "bg-amber-500/15 text-amber-200 border-amber-500/20",
  HIGH: "bg-orange-500/15 text-orange-200 border-orange-500/20",
  URGENT: "bg-rose-500/15 text-rose-200 border-rose-500/20",
};

export default function DashboardView() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [issues, setIssues] = useState<Issue[]>([]);

  const [projectForm, setProjectForm] = useState<ProjectCreateInput>({
    name: "",
    description: "",
  });
  const [issueForm, setIssueForm] = useState<Pick<IssueCreateInput, "title" | "description" | "status" | "priority" | "assignee_id">>({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    assignee_id: null,
  });

  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isSavingIssue, setIsSavingIssue] = useState(false);
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const loadProjects = async () => {
      setIsLoadingProjects(true);
      setProjectError(null);

      const response = await projectService.listProjects();

      if (response.success) {
        const nextProjects = response.data;
        setProjects(nextProjects);

        setSelectedProjectId((current) => {
          const currentExists = nextProjects.some((project) => project.id === current);
          return currentExists ? current : nextProjects[0]?.id ?? "";
        });
      } else {
        setProjectError(getDisplayMessage(response as ErrorResponse));
      }

      setIsLoadingProjects(false);
    };

    void loadProjects();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selectedProjectId) {
      return;
    }

    const loadIssues = async () => {
      setIsLoadingIssues(true);
      setIssueError(null);

      const response = await issueService.listProjectIssues(selectedProjectId);

      if (response.success) {
        setIssues(response.data);
      } else {
        setIssueError(getDisplayMessage(response as ErrorResponse));
      }

      setIsLoadingIssues(false);
    };

    void loadIssues();
  }, [selectedProjectId]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const visibleIssues = useMemo(
    () => (selectedProjectId ? issues : []),
    [selectedProjectId, issues]
  );

  const groupedIssues = useMemo(() => {
    return STATUS_COLUMNS.reduce<Record<IssueStatus, Issue[]>>(
      (accumulator, column) => {
        accumulator[column.value] = visibleIssues.filter((issue) => issue.status === column.value);
        return accumulator;
      },
      {
        BACKLOG: [],
        TODO: [],
        IN_PROGRESS: [],
        DONE: [],
      }
    );
  }, [visibleIssues]);

  const totalIssues = visibleIssues.length;
  const boardSummary = `${projects.length} projects • ${totalIssues} issues • ${selectedProject ? selectedProject.name : "No project selected"}`;

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const handleProjectCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingProject(true);
    setProjectError(null);
    setGlobalMessage(null);

    const response = await projectService.createProject({
      name: projectForm.name.trim(),
      description: projectForm.description?.trim() || null,
    });

    if (response.success) {
      const createdProject = response.data;
      setProjects((current) => [createdProject, ...current]);
      setSelectedProjectId(createdProject.id);
      setProjectForm({ name: "", description: "" });
      setGlobalMessage("Project created successfully.");
    } else {
      setProjectError(getDisplayMessage(response as ErrorResponse));
    }

    setIsSavingProject(false);
  };

  const handleProjectDelete = async (projectId: string) => {
    const confirmed = window.confirm("Delete this project and all of its issues?");
    if (!confirmed) {
      return;
    }

    const response = await projectService.deleteProject(projectId);

    if (response.success) {
      setProjects((current) => {
        const remaining = current.filter((project) => project.id !== projectId);
        setSelectedProjectId((currentSelected) => {
          if (currentSelected !== projectId) {
            return currentSelected;
          }

          return remaining[0]?.id ?? "";
        });
        return remaining;
      });
      setGlobalMessage("Project deleted.");
    } else {
      setProjectError(getDisplayMessage(response as ErrorResponse));
    }
  };

  const handleIssueCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedProjectId) {
      setIssueError("Select a project before creating an issue.");
      return;
    }

    setIsSavingIssue(true);
    setIssueError(null);
    setGlobalMessage(null);

    const payload: IssueCreateInput = {
      title: issueForm.title.trim(),
      description: issueForm.description?.trim() || null,
      status: issueForm.status,
      priority: issueForm.priority,
      project_id: selectedProjectId,
      assignee_id: issueForm.assignee_id?.trim() || null,
    };

    const response = await issueService.createIssue(payload);

    if (response.success) {
      setIssues((current) => [response.data, ...current]);
      setIssueForm({
        title: "",
        description: "",
        status: "TODO",
        priority: "MEDIUM",
        assignee_id: null,
      });
      setGlobalMessage("Issue created successfully.");
    } else {
      setIssueError(getDisplayMessage(response as ErrorResponse));
    }

    setIsSavingIssue(false);
  };

  const handleIssueUpdate = async (issueId: string, patch: IssueUpdateInput) => {
    const response = await issueService.updateIssue(issueId, patch);

    if (response.success) {
      const updatedIssue = response.data;
      setIssues((current) => current.map((issue) => (issue.id === updatedIssue.id ? updatedIssue : issue)));
      return;
    }

    setIssueError(getDisplayMessage(response as ErrorResponse));
  };

  const handleIssueDelete = async (issueId: string) => {
    const confirmed = window.confirm("Delete this issue?");
    if (!confirmed) {
      return;
    }

    const response = await issueService.deleteIssue(issueId);
    if (response.success) {
      setIssues((current) => current.filter((issue) => issue.id !== issueId));
      setGlobalMessage("Issue deleted.");
    } else {
      setIssueError(getDisplayMessage(response as ErrorResponse));
    }
  };

  if (isLoading || isLoadingProjects) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1220] text-brand-text">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300 shadow-2xl backdrop-blur">
          Loading Jira workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b1220]/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1600px] items-center gap-4 px-4 py-3 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0052cc] text-sm font-black text-white shadow-lg shadow-blue-950/40">
              D
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">DevBoard</div>
              <div className="truncate text-sm font-semibold text-white">Jira-style project tracker</div>
            </div>
          </div>

          <div className="hidden flex-1 items-center lg:flex">
            <div className="flex w-full max-w-2xl items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <span>Search issues, projects, and people</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="http://localhost:8000/api/v1/docs" target="_blank" className="hidden rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 lg:inline-flex">
              API Docs
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Sign out
            </button>
            <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm sm:block">
              <div className="font-semibold text-white">{user?.full_name}</div>
              <div className="text-xs text-slate-400">{user?.email}</div>
            </div>
          </div>
        </div>
      </header>

      {globalMessage && (
        <div className="mx-auto w-full max-w-[1600px] px-4 pt-4 lg:px-6">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {globalMessage}
          </div>
        </div>
      )}

      <div className="mx-auto grid w-full max-w-[1600px] gap-4 px-4 py-4 lg:grid-cols-[272px_minmax(0,1fr)] lg:px-6">
        <aside className="space-y-4 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:overflow-y-auto">
          <section className="rounded-2xl border border-white/10 bg-[#111a2e] p-4 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">Projects</p>
                <h2 className="mt-1 text-lg font-bold text-white">Your workspace</h2>
              </div>
              <div className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">{projects.length}</div>
            </div>

            <div className="mt-4 space-y-2">
              {projects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-5 text-sm text-slate-400">
                  Create your first project to start tracking work.
                </div>
              ) : (
                projects.map((project) => {
                  const isActive = selectedProjectId === project.id;

                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => setSelectedProjectId(project.id)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                        isActive
                          ? "border-[#2684ff] bg-[#1c2b4a] shadow-[0_0_0_1px_rgba(38,132,255,0.25)]"
                          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{project.name}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-400">{project.description ?? "No description yet."}</p>
                        </div>
                        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                          {project.id.slice(0, 6)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#111a2e] p-4 shadow-2xl shadow-black/20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">Create project</p>
            <h3 className="mt-1 text-lg font-bold text-white">New project</h3>
            <form className="mt-4 space-y-3" onSubmit={handleProjectCreate}>
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Name</span>
                <input
                  value={projectForm.name}
                  onChange={(event) => setProjectForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#2684ff]"
                  placeholder="Platform Revamp"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Description</span>
                <textarea
                  value={projectForm.description ?? ""}
                  onChange={(event) => setProjectForm((current) => ({ ...current, description: event.target.value }))}
                  className="min-h-24 w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#2684ff]"
                  placeholder="Roadmap, release scope, and ownership notes"
                />
              </label>
              {projectError && <p className="text-sm text-rose-300">{projectError}</p>}
              <button
                type="submit"
                disabled={isSavingProject || !projectForm.name.trim()}
                className="w-full rounded-xl bg-[#2684ff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#4c9aff] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingProject ? "Creating..." : "Create project"}
              </button>
            </form>
          </section>
        </aside>

        <main className="space-y-4">
          <section className="rounded-2xl border border-white/10 bg-[#111a2e] p-5 shadow-2xl shadow-black/20">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">Project overview</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
                  {selectedProject?.name ?? "No project selected"}
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-300">
                  {selectedProject?.description ?? "Select a project to view and manage its issues."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Projects</p>
                  <p className="mt-1 text-2xl font-black text-white">{projects.length}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Issues</p>
                  <p className="mt-1 text-2xl font-black text-white">{totalIssues}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Board</p>
                  <p className="mt-1 truncate text-sm font-semibold text-white">{boardSummary}</p>
                </div>
              </div>
            </div>

            {selectedProject && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleProjectDelete(selectedProject.id)}
                  className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
                >
                  Delete project
                </button>
                <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Issues update in real time when edited below
                </span>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#111a2e] p-5 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">Create issue</p>
                <h2 className="mt-1 text-lg font-bold text-white">Add work to the board</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-slate-300">
                {selectedProjectId ? "Active project selected" : "Pick a project first"}
              </div>
            </div>

            <form className="mt-4 grid gap-4 lg:grid-cols-2" onSubmit={handleIssueCreate}>
              <label className="block space-y-2 lg:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Summary</span>
                <input
                  value={issueForm.title}
                  onChange={(event) => setIssueForm((current) => ({ ...current, title: event.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#2684ff]"
                  placeholder="Fix onboarding wizard accessibility"
                  disabled={!selectedProjectId}
                />
              </label>

              <label className="block space-y-2 lg:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Description</span>
                <textarea
                  value={issueForm.description ?? ""}
                  onChange={(event) => setIssueForm((current) => ({ ...current, description: event.target.value }))}
                  className="min-h-28 w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#2684ff]"
                  placeholder="Describe the work, acceptance criteria, or dependencies"
                  disabled={!selectedProjectId}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Status</span>
                <select
                  value={issueForm.status}
                  onChange={(event) => setIssueForm((current) => ({ ...current, status: event.target.value as IssueStatus }))}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none transition focus:border-[#2684ff]"
                  disabled={!selectedProjectId}
                >
                  {STATUS_COLUMNS.map((column) => (
                    <option key={column.value} value={column.value}>
                      {column.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Priority</span>
                <select
                  value={issueForm.priority}
                  onChange={(event) => setIssueForm((current) => ({ ...current, priority: event.target.value as IssuePriority }))}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none transition focus:border-[#2684ff]"
                  disabled={!selectedProjectId}
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2 lg:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Assignee UUID</span>
                <input
                  value={issueForm.assignee_id ?? ""}
                  onChange={(event) => setIssueForm((current) => ({ ...current, assignee_id: event.target.value || null }))}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#2684ff]"
                  placeholder="Optional UUID"
                  disabled={!selectedProjectId}
                />
              </label>

              {issueError && <p className="lg:col-span-2 text-sm text-rose-300">{issueError}</p>}

              <div className="lg:col-span-2 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <p className="text-sm text-slate-400">
                  {selectedProjectId ? "Issues are saved to the selected project." : "Choose a project first."}
                </p>
                <button
                  type="submit"
                  disabled={isSavingIssue || !selectedProjectId || !issueForm.title.trim()}
                  className="rounded-xl bg-[#2684ff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#4c9aff] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingIssue ? "Creating..." : "Create issue"}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0f172a] p-4 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-3 px-1 pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">Board</p>
                <h2 className="mt-1 text-lg font-bold text-white">Kanban board</h2>
              </div>
              {isLoadingIssues && <span className="text-sm text-slate-400">Loading issues...</span>}
            </div>

            <div className="grid gap-4 xl:grid-cols-4">
              {STATUS_COLUMNS.map((column) => (
                <section key={column.value} className="rounded-2xl border border-white/10 bg-[#111a2e] p-3">
                  <div className="flex items-center justify-between gap-3 px-1">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-[0.24em] text-white">{column.label}</h3>
                      <p className="mt-1 text-xs text-slate-400">Inline edit workflow</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[column.value]}`}>
                      {groupedIssues[column.value].length}
                    </span>
                  </div>

                  <div className="mt-3 space-y-3">
                    {groupedIssues[column.value].length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-sm text-slate-400">
                        No issues in this lane.
                      </div>
                    ) : (
                      groupedIssues[column.value].map((issue) => (
                        <article key={issue.id} className="rounded-2xl border border-white/10 bg-[#0b1220] p-4 shadow-lg shadow-black/10">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white">{issue.title}</p>
                              <p className="mt-1 line-clamp-3 text-sm text-slate-400">{issue.description ?? "No description."}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleIssueDelete(issue.id)}
                              className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                            >
                              Delete
                            </button>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${STATUS_BADGE[issue.status]}`}>
                              {issue.status.replace("_", " ")}
                            </span>
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${PRIORITY_BADGE[issue.priority]}`}>
                              {issue.priority}
                            </span>
                          </div>

                          <div className="mt-4 space-y-3">
                            <label className="block space-y-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                              Status
                              <select
                                value={issue.status}
                                onChange={(event) => handleIssueUpdate(issue.id, { status: event.target.value as IssueStatus })}
                                className="w-full rounded-xl border border-white/10 bg-[#111a2e] px-3 py-2 text-sm text-white outline-none transition focus:border-[#2684ff]"
                              >
                                {STATUS_COLUMNS.map((statusOption) => (
                                  <option key={statusOption.value} value={statusOption.value}>
                                    {statusOption.label}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="block space-y-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                              Priority
                              <select
                                value={issue.priority}
                                onChange={(event) => handleIssueUpdate(issue.id, { priority: event.target.value as IssuePriority })}
                                className="w-full rounded-xl border border-white/10 bg-[#111a2e] px-3 py-2 text-sm text-white outline-none transition focus:border-[#2684ff]"
                              >
                                {PRIORITY_OPTIONS.map((priority) => (
                                  <option key={priority} value={priority}>
                                    {priority}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </section>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
