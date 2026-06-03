import { apiClient } from '@/services/apiClient';
import type {ApiResponse} from '@/types/api';
import {UserCreate} from "@/types/user";
import {User} from "@/types/domain";

export const authService = {
    async login(email:string, password:string): Promise<ApiResponse<{ message: string }>> {
        return apiClient.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },
    async register(userData: UserCreate): Promise<ApiResponse<{ message: string }>> {
        return apiClient.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },
    async getCurrentUser(): Promise<ApiResponse<User>> {
        return apiClient.request('/api/auth/me', {
            method: 'GET',
        });
    },
    async logout(): Promise<ApiResponse<{ message: string }>> {
        return apiClient.request('/api/auth/logout', {
            method: 'POST',
        });
    },
    
}