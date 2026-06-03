import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";
import type { Project } from "@/types/domain";
import type { ProjectCreateInput } from "@/types/project";

export const projectService = {
  async listProjects(): Promise<ApiResponse<Project[]>> {
    return apiClient.request("/api/projects", { method: "GET" });
  },

  async createProject(payload: ProjectCreateInput): Promise<ApiResponse<Project>> {
    return apiClient.request("/api/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getProject(projectId: string): Promise<ApiResponse<Project>> {
    return apiClient.request(`/api/projects/${projectId}`, { method: "GET" });
  },

  async deleteProject(projectId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.request(`/api/projects/${projectId}`, { method: "DELETE" });
  },
};
