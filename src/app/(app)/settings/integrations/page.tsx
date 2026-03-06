'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { 
  GitBranch, 
  Server, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Plus,
  ExternalLink,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface GitIntegration {
  id: string;
  provider: string;
  repoOwner: string;
  repoName: string;
  isActive: boolean;
  lastSyncAt: string | null;
  syncStatus: string;
  syncError: string | null;
}

interface CICDIntegration {
  id: string;
  provider: string;
  projectId: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
  syncStatus: string;
  syncError: string | null;
}

interface SyncStats {
  pullRequests: number;
  codeReviews: number;
  builds: number;
  deployments: number;
}

const gitProviderOptions = [
  { value: 'GITHUB', label: 'GitHub' },
  { value: 'GITLAB', label: 'GitLab' },
  { value: 'BITBUCKET', label: 'Bitbucket' },
];

const cicdProviderOptions = [
  { value: 'GITHUB_ACTIONS', label: 'GitHub Actions' },
  { value: 'GITLAB_CI', label: 'GitLab CI' },
  { value: 'JENKINS', label: 'Jenkins' },
  { value: 'CIRCLECI', label: 'CircleCI' },
];

export default function IntegrationsPage() {
  const [gitIntegration, setGitIntegration] = useState<GitIntegration | null>(null);
  const [cicdIntegration, setCicdIntegration] = useState<CICDIntegration | null>(null);
  const [syncStats, setSyncStats] = useState<SyncStats>({ pullRequests: 0, codeReviews: 0, builds: 0, deployments: 0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  // Git Modal
  const [showGitModal, setShowGitModal] = useState(false);
  const [gitForm, setGitForm] = useState({
    provider: 'GITHUB',
    repoOwner: '',
    repoName: '',
    accessToken: '',
  });
  const [gitSaving, setGitSaving] = useState(false);
  const [gitError, setGitError] = useState('');

  // CI/CD Modal
  const [showCicdModal, setShowCicdModal] = useState(false);
  const [cicdForm, setCicdForm] = useState({
    provider: 'GITHUB_ACTIONS',
    projectId: '',
    accessToken: '',
  });
  const [cicdSaving, setCicdSaving] = useState(false);
  const [cicdError, setCicdError] = useState('');

  useEffect(() => {
    fetchIntegrations();
  }, []);

  async function fetchIntegrations() {
    try {
      const res = await fetch('/api/settings/integrations');
      const data = await res.json();
      setGitIntegration(data.git);
      setCicdIntegration(data.cicd);
      if (data.stats) {
        setSyncStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch integrations', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveGit(e: React.FormEvent) {
    e.preventDefault();
    setGitError('');
    setGitSaving(true);

    try {
      const res = await fetch('/api/settings/integrations/git', {
        method: gitIntegration ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gitForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      setGitIntegration(data);
      setShowGitModal(false);
      setGitForm({ provider: 'GITHUB', repoOwner: '', repoName: '', accessToken: '' });
    } catch (err) {
      setGitError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setGitSaving(false);
    }
  }

  async function handleSaveCicd(e: React.FormEvent) {
    e.preventDefault();
    setCicdError('');
    setCicdSaving(true);

    try {
      const res = await fetch('/api/settings/integrations/cicd', {
        method: cicdIntegration ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cicdForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      setCicdIntegration(data);
      setShowCicdModal(false);
      setCicdForm({ provider: 'GITHUB_ACTIONS', projectId: '', accessToken: '' });
    } catch (err) {
      setCicdError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setCicdSaving(false);
    }
  }

  async function handleSync(type: 'git' | 'cicd') {
    setSyncing(type);
    try {
      const res = await fetch(`/api/settings/integrations/${type}/sync`, { method: 'POST' });
      if (!res.ok) throw new Error('Sync failed');
      await fetchIntegrations();
    } catch (err) {
      console.error('Sync failed', err);
    } finally {
      setSyncing(null);
    }
  }

  async function handleDisconnect(type: 'git' | 'cicd') {
    if (!confirm('Are you sure you want to disconnect this integration?')) return;
    
    try {
      await fetch(`/api/settings/integrations/${type}`, { method: 'DELETE' });
      if (type === 'git') setGitIntegration(null);
      else setCicdIntegration(null);
    } catch (err) {
      console.error('Disconnect failed', err);
    }
  }

  function getStatusBadge(status: string, error: string | null) {
    if (status === 'SUCCESS') {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30" size="sm">Connected</Badge>;
    }
    if (status === 'SYNCING') {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30" size="sm">Syncing...</Badge>;
    }
    if (status === 'FAILED') {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30" size="sm">Error</Badge>;
    }
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30" size="sm">Pending</Badge>;
  }

  function formatLastSync(date: string | null) {
    if (!date) return 'Never';
    const d = new Date(date);
    return d.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
  }

  if (loading) {
    return (
      <>
        <Header title="Integrations" subtitle="Connect your Git and CI/CD pipelines" />
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Integrations" subtitle="Connect your Git and CI/CD pipelines" />

      <div className="p-6 space-y-5">
        {/* Git Integration */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Git Integration</h3>
                <p className="text-xs text-gray-500">Pull requests, code reviews, commit data</p>
              </div>
            </div>
            {gitIntegration && getStatusBadge(gitIntegration.syncStatus, gitIntegration.syncError)}
          </div>

          {gitIntegration ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-surface-2 border border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white flex items-center gap-2">
                      {gitIntegration.provider === 'GITHUB' && (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      )}
                      {gitIntegration.repoOwner}/{gitIntegration.repoName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last sync: {formatLastSync(gitIntegration.lastSyncAt)}
                    </p>
                    {gitIntegration.syncError && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {gitIntegration.syncError}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSync('git')}
                      disabled={syncing === 'git'}
                    >
                      {syncing === 'git' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      Sync Now
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDisconnect('git')}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-lg border border-dashed border-border bg-surface-2/50 text-center">
              <GitBranch className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400 mb-3">No Git repository connected</p>
              <Button size="sm" onClick={() => setShowGitModal(true)}>
                <Plus className="w-3.5 h-3.5" />
                Connect Repository
              </Button>
            </div>
          )}
        </Card>

        {/* CI/CD Integration */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                <Server className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">CI/CD Integration</h3>
                <p className="text-xs text-gray-500">Build status, test coverage, deployments</p>
              </div>
            </div>
            {cicdIntegration && getStatusBadge(cicdIntegration.syncStatus, cicdIntegration.syncError)}
          </div>

          {cicdIntegration ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-surface-2 border border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white flex items-center gap-2">
                      {cicdIntegration.provider.replace('_', ' ')}
                      {cicdIntegration.projectId && (
                        <span className="text-gray-500">• {cicdIntegration.projectId}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last sync: {formatLastSync(cicdIntegration.lastSyncAt)}
                    </p>
                    {cicdIntegration.syncError && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {cicdIntegration.syncError}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSync('cicd')}
                      disabled={syncing === 'cicd'}
                    >
                      {syncing === 'cicd' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      Sync Now
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDisconnect('cicd')}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-lg border border-dashed border-border bg-surface-2/50 text-center">
              <Server className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400 mb-3">No CI/CD pipeline connected</p>
              <Button size="sm" onClick={() => setShowCicdModal(true)}>
                <Plus className="w-3.5 h-3.5" />
                Connect Pipeline
              </Button>
            </div>
          )}
        </Card>

        {/* Data Sync Stats */}
        {(gitIntegration || cicdIntegration) && (
          <Card>
            <h3 className="text-sm font-semibold text-white mb-4">Synced Data Overview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-surface-2 border border-border/50">
                <p className="text-2xl font-bold text-white">{syncStats.pullRequests}</p>
                <p className="text-xs text-gray-500 mt-0.5">Pull Requests</p>
              </div>
              <div className="p-4 rounded-lg bg-surface-2 border border-border/50">
                <p className="text-2xl font-bold text-white">{syncStats.codeReviews}</p>
                <p className="text-xs text-gray-500 mt-0.5">Code Reviews</p>
              </div>
              <div className="p-4 rounded-lg bg-surface-2 border border-border/50">
                <p className="text-2xl font-bold text-white">{syncStats.builds}</p>
                <p className="text-xs text-gray-500 mt-0.5">Builds</p>
              </div>
              <div className="p-4 rounded-lg bg-surface-2 border border-border/50">
                <p className="text-2xl font-bold text-white">{syncStats.deployments}</p>
                <p className="text-xs text-gray-500 mt-0.5">Deployments</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Git Modal */}
      <Modal open={showGitModal} onClose={() => setShowGitModal(false)} title="Connect Git Repository" size="md">
        <form onSubmit={handleSaveGit} className="space-y-4">
          <Select
            label="Git Provider"
            value={gitForm.provider}
            onChange={(e) => setGitForm({ ...gitForm, provider: e.target.value })}
            options={gitProviderOptions}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Repository Owner"
              placeholder="e.g., facebook"
              value={gitForm.repoOwner}
              onChange={(e) => setGitForm({ ...gitForm, repoOwner: e.target.value })}
              required
            />
            <Input
              label="Repository Name"
              placeholder="e.g., react"
              value={gitForm.repoName}
              onChange={(e) => setGitForm({ ...gitForm, repoName: e.target.value })}
              required
            />
          </div>
          <Input
            label="Personal Access Token"
            type="password"
            placeholder="ghp_xxxxxxxxxxxx"
            value={gitForm.accessToken}
            onChange={(e) => setGitForm({ ...gitForm, accessToken: e.target.value })}
            required
          />
          <p className="text-xs text-gray-500">
            Create a PAT with <code className="text-primary-light">repo</code> scope.{' '}
            <a 
              href="https://github.com/settings/tokens/new" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Generate token <ExternalLink className="w-3 h-3" />
            </a>
          </p>

          {gitError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
              {gitError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowGitModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={gitSaving} className="flex-1">
              Connect
            </Button>
          </div>
        </form>
      </Modal>

      {/* CI/CD Modal */}
      <Modal open={showCicdModal} onClose={() => setShowCicdModal(false)} title="Connect CI/CD Pipeline" size="md">
        <form onSubmit={handleSaveCicd} className="space-y-4">
          <Select
            label="CI/CD Provider"
            value={cicdForm.provider}
            onChange={(e) => setCicdForm({ ...cicdForm, provider: e.target.value })}
            options={cicdProviderOptions}
          />
          <Input
            label="Project ID (Optional)"
            placeholder="For Jenkins/CircleCI projects"
            value={cicdForm.projectId}
            onChange={(e) => setCicdForm({ ...cicdForm, projectId: e.target.value })}
          />
          <Input
            label="API Token"
            type="password"
            placeholder="API access token"
            value={cicdForm.accessToken}
            onChange={(e) => setCicdForm({ ...cicdForm, accessToken: e.target.value })}
            required
          />
          <p className="text-xs text-gray-500">
            {cicdForm.provider === 'GITHUB_ACTIONS' && 'Use the same GitHub PAT with workflow permissions.'}
            {cicdForm.provider === 'GITLAB_CI' && 'Use a GitLab personal access token with api scope.'}
            {cicdForm.provider === 'JENKINS' && 'Use a Jenkins API token from your user settings.'}
            {cicdForm.provider === 'CIRCLECI' && 'Use a CircleCI personal API token.'}
          </p>

          {cicdError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
              {cicdError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCicdModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={cicdSaving} className="flex-1">
              Connect
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
