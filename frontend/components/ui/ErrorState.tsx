'use client';

import { Button } from './Button';
import { ServerCrash } from 'lucide-react';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
  className?: string;
}

export function ErrorState({ error, onRetry, className = '' }: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-6 bg-red-500/10 border border-red-500/20 rounded-lg text-center ${className}`}>
      <ServerCrash className="w-8 h-8 text-red-500 mb-2" />
      <p className="text-red-500 font-bold">{error}</p>
      <Button onClick={onRetry} className="mt-4" variant="primary">
        Try Again
      </Button>
    </div>
  );
}
