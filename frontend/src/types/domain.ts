/**
 * @fileoverview Concrete domain entity contracts for user, project and Issue. 
 * These are the "core" types that the frontend will use to interact with the backend and manage state.
 */
export type IssueStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/**
 * Represents an authenticated profile model
 */
export interface User {
    id: string;
    email: string;
    full_name: string;
    created_at: string; 
}
/**
 * Represents a project entity
 */
export interface Project {
    id: string;
    name: string;
    description: string | null;
    owner_id: string;
    created_at: string;
    updated_at: string;
}
/**
 * Represents an issue entity
 */
export interface Issue{
    id: string;
    title: string;
    description: string | null;
    status: IssueStatus;
    priority: IssuePriority;
    project_id: string;
    assignee_id: string | null;
    reporter_id: string;
    created_at: string;
    updated_at: string;
}