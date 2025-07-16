export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin ${className}`} />
  );
}
