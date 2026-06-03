import Card from '@/components/ui/Card';

interface AuthCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark px-4">
      <Card className="w-full max-w-md py-15">
        {title && <h2 className="text-3xl font-extrabold tracking-tight text-white text-center">{title}</h2>}
        {subtitle && <p className="mt-2 text-sm text-brand-text text-center">{subtitle}</p>}
        <div className="mt-4">{children}</div>
      </Card>
    </div>
  );
}
