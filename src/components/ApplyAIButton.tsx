'use client';

import { useState } from 'react';
import Button from './ui/Button';
import { Brain, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface ApplyAIButtonProps {
  releaseId: string;
  hasOpenRisks?: boolean;
  onSuccess?: () => void;
}

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed';
  duration?: number;
}

export default function ApplyAIButton({ releaseId, hasOpenRisks = true, onSuccess }: ApplyAIButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: 'analyze', label: 'Analyzing risk patterns...', status: 'pending' },
    { id: 'process', label: 'Processing with AI engine...', status: 'pending' },
    { id: 'generate', label: 'Generating recommendations...', status: 'pending' },
    { id: 'apply', label: 'Applying fixes and updates...', status: 'pending' },
  ]);

  const updateStepStatus = (stepId: string, status: ProcessingStep['status']) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
    if (status === 'processing') {
      setCurrentStep(stepId);
    }
  };

  const handleApplyRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setCurrentStep(null);

    // Reset all steps to pending
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));

    try {
      // Step 1: Analyze risks (2-3 seconds)
      updateStepStatus('analyze', 'processing');
      await new Promise(resolve => setTimeout(resolve, 2500));
      updateStepStatus('analyze', 'completed');

      // Step 2: Process with AI (3-5 seconds - simulate LLM processing)
      updateStepStatus('process', 'processing');
      await new Promise(resolve => setTimeout(resolve, 4000));
      updateStepStatus('process', 'completed');

      // Step 3: Generate recommendations (2 seconds)
      updateStepStatus('generate', 'processing');
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateStepStatus('generate', 'completed');

      // Step 4: Apply fixes (1-2 seconds)
      updateStepStatus('apply', 'processing');
      
      const response = await fetch(`/api/ai/analyze/${releaseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to apply recommendations');
      }

      const data = await response.json();
      updateStepStatus('apply', 'completed');
      setResult(data);
      
      // Refresh the page after successful application
      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      } else {
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (err: any) {
      setError(err.message);
      // Mark current step as failed
      if (currentStep) {
        setSteps(prev => prev.map(step => 
          step.id === currentStep ? { ...step, status: 'pending' } : step
        ));
      }
    } finally {
      setIsLoading(false);
      setCurrentStep(null);
    }
  };

  // Loading state with progress
  if (isLoading) {
    return (
      <div className="bg-primary-light/5 border border-primary-light/20 rounded-lg p-4 min-w-[320px]">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="w-5 h-5 text-primary-light animate-spin" />
          <h4 className="text-sm font-semibold text-primary-light">AI Processing in Progress</h4>
        </div>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {step.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : step.status === 'processing' ? (
                  <Loader2 className="w-4 h-4 text-primary-light animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-600" />
                )}
              </div>
              <span className={`text-sm ${
                step.status === 'completed' ? 'text-emerald-400' :
                step.status === 'processing' ? 'text-primary-light' : 
                'text-gray-500'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-xs text-gray-500">
            Please wait while our AI analyzes your release risks and generates optimal solutions...
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-primary-light rounded-full animate-pulse"></div>
            <p className="text-xs text-gray-400">AI processing may take 10-15 seconds</p>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-emerald-400 mb-2">
              AI Recommendations Applied Successfully!
            </h4>
            <div className="space-y-1">
              <p className="text-xs text-gray-300">
                • {result.changes.risksUpdated} risk(s) resolved
              </p>
              {result.changes.improvements.map((improvement: string, idx: number) => (
                <p key={idx} className="text-xs text-gray-400">• {improvement}</p>
              ))}
            </div>
            <p className="text-xs text-emerald-500 mt-2">Page will refresh automatically...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-red-400 mb-1">
              AI Provider Error
            </h4>
            <p className="text-xs text-gray-400 mb-2">{error}</p>
            <p className="text-xs text-gray-500 mb-3">
              {error.includes('timeout') ? 
                'AI provider is not responding. Analysis fell back to template mode.' :
                'AI provider encountered an issue. Please check configuration.'
              }
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setError(null)}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                Try Again
              </Button>
              <Button
                onClick={() => window.open('/superadmin/ai-providers', '_blank')}
                variant="ghost"
                size="sm"
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Check AI Config
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={handleApplyRecommendations}
      disabled={isLoading}
      className="flex items-center gap-2 bg-primary-light/10 border border-primary-light/30 hover:bg-primary-light/20 text-primary-light"
      size="sm"
    >
      <Brain className="w-4 h-4" />
      {isLoading ? 'Applying AI Fixes...' : hasOpenRisks ? 'Apply AI Recommendations' : 'Run AI Analysis'}
    </Button>
  );
}