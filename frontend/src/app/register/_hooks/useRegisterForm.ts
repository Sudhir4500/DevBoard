import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { getDisplayMessage, getFieldErrors } from '@/lib/errors';
import type { ErrorResponse } from '@/types/api';

export function useRegisterForm(){
    const router = useRouter();

    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldError, setFieldError]= useState<Record<string, string>>({});

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError(null);
        setFieldError({});
        setIsSubmitting(true);

        const form = new FormData(e.currentTarget);
        const userData = {
            full_name: form.get("full_name") as string,
            email: form.get("email") as string,
            password: form.get("password") as string,
        };
        try{
            const res = await authService.register(userData);
            if(!res.success){
                setFieldError(getFieldErrors(res));
                setFormError(getDisplayMessage(res));
                return;
            }
            router.push('/login');
        } catch (error) {
            setFormError(getDisplayMessage(error as ErrorResponse));
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return { formError, fieldError, isSubmitting, onSubmit };
}