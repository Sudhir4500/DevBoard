interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-2xl shadow-xl p-6 bg-brand-surface border border-brand-border ${className}`}>
      {children}
    </div>
  );
}
