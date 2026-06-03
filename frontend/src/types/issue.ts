import type { IssuePriority, IssueStatus } from "@/types/domain";

export interface IssueCreateInput {
  title: string;
  description?: string | null;
  status?: IssueStatus;
  priority?: IssuePriority;
  assignee_id?: string | null;
  project_id: string;
}

export interface IssueUpdateInput {
  title?: string;
  description?: string | null;
  status?: IssueStatus;
  priority?: IssuePriority;
  assignee_id?: string | null;
}
