"use client";

import AuthCard from './AuthCard';
import { useLoginForm } from '@/app/login/_hooks/useLoginForm';
import ErrorPage from '@/components/ui/Error';
import InputField from '@/components/ui/InputField';
import Link from "next/link";
import { useState } from "react";

export default function LoginForm() {
  const {setEmail, setPassword, formError, isSubmitting, onSubmit } = useLoginForm();
  
  const [showPassword, setShowPassword] = useState(false);
  return (
    <AuthCard title="DevBoard Workspace" subtitle="Sign in to your workspace">
      {formError && <ErrorPage message={formError} />}
      <form className="mt-6 space-y-6" onSubmit={onSubmit}>
        <div className="space-y-4">
    
          <InputField
            label="Email Address"
            type="email"
            placeholder="developer@devboard.io"
            onChange={(e) => setEmail(e.target.value)}
          />

          <InputField
            label="Account Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••••••"
            onChange={(e) => setPassword(e.target.value)}
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

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-brand-text bg-brand-primary hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-brand-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Verifying Credentials...' : 'Sign In to Dashboard'}
          </button>
        </div>
        {/* redirect to register page */}
          <p className="mt-2 text-sm text-center text-brand-text">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-brand-primary hover:text-brand-hover">
              Sign Up
            </Link>
          </p>
      </form>
    </AuthCard>
  );
}
