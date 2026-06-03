import type { ApiResponse } from '@/types/api';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

export const apiClient = {
  async request<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {

    const { params, headers, ...restOptions } = options;

    let targetUrl = endpoint;

    if (params) {
      const searchParams = new URLSearchParams(params);
      targetUrl += `?${searchParams.toString()}`;
    }

    try {
      const response = await fetch(targetUrl, {
        ...restOptions,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });
      /**
       * Handle 401 Unauthorized globally: if the user is not authenticated, redirect to login page.
       * it will not run if the user is already on the login or register page to avoid redirect loops.
       * 
       */
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          const isAuthPage = ['/','/login', '/register'].includes(window.location.pathname);

          if (!isAuthPage) {
            window.location.replace('/login');
          }
        }

        return {
          success: false,
          message: 'Unauthorized',
          errors: [],
        } as ApiResponse<T>;
      }

      // backend already returns our ApiResponse format
      const payload = await response.json();

      return payload as ApiResponse<T>;

    } catch (error) {
      return {
        success: false,
        message: 'Network request failed',
        errors: [
          {
            code: 'NETWORK_ERROR',
            message:
              error instanceof Error
                ? error.message
                : 'Unknown network error',
          },
        ],
      };
    }
  },
};