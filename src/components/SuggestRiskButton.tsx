'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  Sparkles, Loader2, AlertCircle, CheckCircle2, Check, X,
} from 'lucide-react';

interface SuggestedRisk {
  title: string;
  description: string;
  category: string;
  severity: string;
  score: number;
}

interface SuggestRiskButtonProps {
  releaseId: string;
  hasDescription: boolean;
}

const severityBadge: Record<string, string> = {
  CRITICAL: 'bg-red-500/20 text-red-400 border border-red-500/30',
  HIGH:     'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  MEDIUM:   'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  LOW:      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
};

const categoryLabel: Record<string, string> = {
  ENGINEERING:     'Engineering',
  USER_JOURNEY:    'User Journey',
  RELEASE_PROCESS: 'Release Process',
  SECURITY:        'Security',
  PERFORMANCE:     'Performance',
};

export default function SuggestRiskButton({ releaseId, hasDescription }: SuggestRiskButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedRisk[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [done, setDone] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    setSelected([]);
    setDone(false);
    setSavedCount(0);

    try {
      const res = await fetch(`/api/ai/suggest-risks/${releaseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate suggestions');
      }

      setSuggestions(data.risks);
      setSelected(new Array(data.risks.length).fill(true));
      setOpen(true);
    } catch (err: any) {
      setError(err.message);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  function toggleRisk(index: number) {
    setSelected((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }

  function toggleAll() {
    const allSelected = selected.every(Boolean);
    setSelected(new Array(suggestions.length).fill(!allSelected));
  }

  async function handleSave() {
    const risksToSave = suggestions.filter((_, i) => selected[i]);
    if (risksToSave.length === 0) return;

    setSaving(true);
    setError(null);

    let saved = 0;
    const errors: string[] = [];

    for (const risk of risksToSave) {
      try {
        const res = await fetch('/api/risks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: risk.title,
            description: risk.description,
            category: risk.category,
            severity: risk.severity,
            score: risk.score,
            releaseId,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          errors.push(`${risk.title}: ${data.error || 'Failed'}`);
        } else {
          saved++;
        }
      } catch {
        errors.push(`${risk.title}: Network error`);
      }
    }

    setSavedCount(saved);

    if (errors.length > 0) {
      setError(`${saved} saved, ${errors.length} failed: ${errors[0]}`);
    }

    setDone(true);
    setSaving(false);

    if (errors.length === 0) {
      setTimeout(() => {
        setOpen(false);
        router.refresh();
      }, 1500);
    }
  }

  function handleClose() {
    setOpen(false);
    if (done && savedCount > 0) {
      router.refresh();
    }
  }

  const selectedCount = selected.filter(Boolean).length;

  return (
    <>
      <Button
        onClick={handleGenerate}
        variant="secondary"
        size="sm"
        disabled={loading || !hasDescription}
        title={!hasDescription ? 'Add a release description first' : 'AI will suggest risks based on the release description'}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-primary-light" />
        )}
        {loading ? 'Analyzing...' : 'AI Suggest Risks'}
      </Button>

      <Modal open={open} onClose={handleClose} title="AI Suggested Risks" size="lg">
        {/* Error state */}
        {error && !done && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-400">{error}</p>
              <Button
                onClick={() => { setOpen(false); handleGenerate(); }}
                variant="ghost"
                size="sm"
                className="mt-2 text-xs text-primary-light"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Success state */}
        {done && savedCount > 0 && (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-sm text-emerald-400 font-medium">
                {savedCount} risk{savedCount > 1 ? 's' : ''} added successfully!
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Refreshing page...</p>
            </div>
          </div>
        )}

        {/* Suggestions list */}
        {suggestions.length > 0 && !done && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">
                {suggestions.length} risk{suggestions.length > 1 ? 's' : ''} suggested — select which to add
              </p>
              <button
                onClick={toggleAll}
                className="text-xs text-primary-light hover:text-primary transition-colors"
              >
                {selected.every(Boolean) ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
              {suggestions.map((risk, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleRisk(idx)}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selected[idx]
                      ? 'bg-primary-light/5 border-primary-light/30'
                      : 'bg-surface-2 border-border/50 opacity-60'
                  }`}
                >
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border transition-colors ${
                    selected[idx]
                      ? 'bg-primary-light border-primary-light'
                      : 'bg-transparent border-gray-600'
                  }`}>
                    {selected[idx] && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>

                  {/* Severity bar */}
                  <div
                    className="w-1 self-stretch rounded-full flex-shrink-0 mt-1"
                    style={{
                      backgroundColor:
                        risk.severity === 'CRITICAL' ? '#dc2626' :
                        risk.severity === 'HIGH' ? '#ef4444' :
                        risk.severity === 'MEDIUM' ? '#f59e0b' : '#10b981',
                    }}
                  />

                  {/* Risk content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">{risk.title}</span>
                      <Badge className={severityBadge[risk.severity] || ''} size="sm">
                        {risk.severity}
                      </Badge>
                      <Badge className="bg-gray-500/20 text-gray-400 border border-gray-500/30 text-[10px] px-1.5 py-0.5" size="sm">
                        {categoryLabel[risk.category] || risk.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{risk.description}</p>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-semibold ${
                      risk.score >= 75 ? 'text-red-400' : risk.score >= 50 ? 'text-yellow-400' : 'text-emerald-400'
                    }`}>
                      {risk.score}
                    </p>
                    <p className="text-[10px] text-gray-600">score</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 mt-4 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="flex-1"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                loading={saving}
                disabled={selectedCount === 0}
                className="flex-1"
              >
                {saving
                  ? 'Saving...'
                  : `Add ${selectedCount} Risk${selectedCount !== 1 ? 's' : ''}`}
              </Button>
            </div>

            {/* Saving error with done */}
            {done && error && (
              <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-xs text-yellow-400">{error}</p>
                <Button
                  onClick={handleClose}
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs"
                >
                  Close
                </Button>
              </div>
            )}
          </>
        )}

        {/* Loading state in modal */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="relative">
              <Sparkles className="w-6 h-6 text-primary-light animate-pulse" />
              <div className="absolute -inset-2 bg-primary-light/10 rounded-full animate-ping" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-primary-light">AI is analyzing the release...</p>
              <p className="text-xs text-gray-500 mt-1">
                Reading description and generating risk suggestions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 text-gray-500 animate-spin" />
              <p className="text-[10px] text-gray-600">This may take 15–45 seconds</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
