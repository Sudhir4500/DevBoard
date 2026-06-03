'use client';

import AuthCard from "./AuthCard";
import ErrorPage from "@/components/ui/Error";
import { useRegisterForm } from "@/app/register/_hooks/useRegisterForm";
import InputField from "@/components/ui/InputField";
import {useState} from "react";
import Link from "next/link";

export default function RegisterForm(){
    const {  formError, fieldError, isSubmitting, onSubmit } = useRegisterForm();
    const [showPassword, setShowPassword] = useState(false);
    return (
       <AuthCard title="Create an account" subtitle="Join DevBoard and start managing your projects today!">
         {formError && <ErrorPage message={formError} />}
         <form className="mt-6 space-y-6" onSubmit={onSubmit}>
            <div className="space-y-4">
                <InputField
                    label="Full Name"
                    name="full_name"
                    type="text"
                    placeholder="John Doe"
                />
                {fieldError.full_name && <p className="text-sm text-issue-medium">{fieldError.full_name}</p>}
                <InputField
                    label="Email Address"
                    name="email"
                    type="email"
                    placeholder="developer@devboard.io"
                    />
                    {fieldError.email && <p className="text-sm text-issue-medium">{fieldError.email}</p>}

                <InputField
                    label="Password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="pr-20"
                    placeholder="••••••••••••"
                    endAdornment={
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-xs font-semibold text-brand-primary hover:text-brand-hover transition-colors"
                        >
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    }
                />
             </div>
                {fieldError.password && <p className="text-sm text-issue-medium">{fieldError.password}</p>}
        
             <div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-brand-text bg-brand-primary hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-brand-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
             </div>
             {/* redirect to login page */}
             <div className="mt-2 text-sm text-center text-brand-text">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-brand-primary hover:text-brand-hover">
                    Sign In
                </Link>
             </div>
             

            </form>
        </AuthCard>
    )
}