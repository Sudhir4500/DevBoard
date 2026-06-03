interface ErrorPageProps {
    message?: string;
}

export default function ErrorPage({ message }: ErrorPageProps) {
    return (
        <div className="p-4 bg-issue-high/10 border border-issue-high/20 rounded-xl text-sm text-issue-high transition-all">
            <span className="font-semibold"></span> {message}
          </div>
    );
}