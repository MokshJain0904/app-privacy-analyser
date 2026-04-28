'use client';

/**
 * Skeleton loading components for loading states
 */

export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2 animate-pulse last:mb-0"
          style={{ width: `${85 + Math.random() * 15}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 border border-slate-200 dark:border-slate-800 ${className}`}>
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-2/3 animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-5/6 animate-pulse" />
      </div>
      <div className="pt-2">
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

export function SkeletonPermissionGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="h-[100px] sm:h-[120px] bg-slate-200 dark:bg-slate-700 rounded-2xl sm:rounded-3xl animate-pulse"
        />
      ))}
    </div>
  );
}

export function SkeletonAnalysisResult() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-8 duration-700">
      <div className="bg-slate-200 dark:bg-slate-700 rounded-3xl h-48 animate-pulse" />
      <div className="space-y-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-5/6 animate-pulse" />
      </div>
    </div>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`${sizeClasses[size]} border-2 border-slate-300 dark:border-slate-600 border-t-indigo-600 rounded-full animate-spin`} />
  );
}

export function ProgressBar({ progress = 0, animated = true }: { progress?: number; animated?: boolean }) {
  return (
    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div
        className={`h-full bg-indigo-600 rounded-full transition-all duration-300 ${animated ? 'animate-pulse' : ''}`}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}
