import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";
import type { Issue } from "@/types/domain";
import type { IssueCreateInput, IssueUpdateInput } from "@/types/issue";

export const issueService = {
  async listProjectIssues(projectId: string): Promise<ApiResponse<Issue[]>> {
    return apiClient.request("/api/issues", {
      method: "GET",
      params: { project_id: projectId },
    });
  },

  async createIssue(payload: IssueCreateInput): Promise<ApiResponse<Issue>> {
    return apiClient.request("/api/issues", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateIssue(issueId: string, payload: IssueUpdateInput): Promise<ApiResponse<Issue>> {
    return apiClient.request(`/api/issues/${issueId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async deleteIssue(issueId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.request(`/api/issues/${issueId}`, { method: "DELETE" });
  },
};
