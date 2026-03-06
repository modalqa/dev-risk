'use client';

import { useState } from 'react';
import Button from './ui/Button';
import { Loader2, Sparkles, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RunAnalysisButtonProps {
  releaseId: string;
  hasExistingAnalysis?: boolean;
}

export default function RunAnalysisButton({
  releaseId,
  hasExistingAnalysis = false,
}: RunAnalysisButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRunAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/ai/analyze/${releaseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setSuccess(true);
      // Refresh page to show new analysis results
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center gap-2 text-emerald-400">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-xs font-medium">Analysis complete! Loading results...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-red-400 leading-relaxed">{error}</p>
          </div>
        </div>
        <Button
          onClick={() => {
            setError(null);
            handleRunAnalysis();
          }}
          variant="ghost"
          size="sm"
          className="text-xs text-primary-light"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="relative">
          <Sparkles className="w-6 h-6 text-primary-light animate-pulse" />
          <div className="absolute -inset-2 bg-primary-light/10 rounded-full animate-ping" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-primary-light">AI is analyzing...</p>
          <p className="text-xs text-gray-500 mt-1">
            Processing {hasExistingAnalysis ? '' : ''}risk items with AI engine
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="w-3 h-3 text-gray-500 animate-spin" />
          <p className="text-[10px] text-gray-600">Please wait, this process may take 20–60 seconds</p>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={handleRunAnalysis}
      disabled={isLoading}
      className="flex items-center gap-2 bg-primary-light/10 border border-primary-light/30 hover:bg-primary-light/20 text-primary-light"
      size="sm"
    >
      {hasExistingAnalysis ? (
        <>
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="text-xs">Re-run Analysis</span>
        </>
      ) : (
        <>
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-xs">Run AI Analysis</span>
        </>
      )}
    </Button>
  );
}
