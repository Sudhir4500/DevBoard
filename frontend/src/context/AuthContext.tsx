'use client';

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types/domain";
import { authService } from "@/services/authService";

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const isAuthenticated = !!user;
    const [isLoading, setIsLoading] = useState(true);

    // Check if user is already authenticated on mount
    useEffect(() => {
        const checkAuth = async () =>{
            try {
                const response = await authService.getCurrentUser();
                if (response.success){
                    setUser(response.data);
                } 
                }catch {
                    setUser(null);
                } finally {
                    setIsLoading(false);
                }
        }
        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await authService.login(email, password);
            if (response.success) {
                // After successful login, fetch user data
                const userResponse = await authService.getCurrentUser();
                if (userResponse.success) {
                    setUser(userResponse.data);
                }
            } else {
                throw new Error(response.message || "Login failed");
            }
        } catch (error) {
            setUser(null);
            throw error;
        }
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
        router.refresh();
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = (): AuthContextType => {
    const context = React.useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};