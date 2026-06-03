// app/login/_hooks/useLoginForm.ts
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getDisplayMessage } from '@/lib/errors';
import type { ErrorResponse } from '@/types/api';

export function useLoginForm() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (error) {
      // login() throws the ErrorResponse when res.success is false
      setFormError(getDisplayMessage(error as ErrorResponse));
    } finally {
      setIsSubmitting(false);
    }
  };

  return { email, setEmail, password, setPassword, formError, isSubmitting, onSubmit };
}