'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Settings, Plus, TestTube, Trash2, Edit } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';

interface AiProvider {
  id: string;
  name: string;
  type: string;
  displayName: string;
  isActive: boolean;
  apiKey?: string | null;
  baseUrl?: string | null;
  model: string;
  config?: any;
  createdAt: string;
  updatedAt: string;
}

export default function AiProvidersPage() {
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AiProvider | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);

  const [formData, setFormData] = useState({
    type: '',
    displayName: '',
    apiKey: '',
    baseUrl: '',
    model: '',
    config: '',
    isActive: false,
  });

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const res = await fetch('/api/superadmin/ai-providers');
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers);
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingProvider 
        ? `/api/superadmin/ai-providers/${editingProvider.id}`
        : '/api/superadmin/ai-providers';
      
      const method = editingProvider ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          config: formData.config ? JSON.parse(formData.config) : null,
        }),
      });

      if (res.ok) {
        await loadProviders();
        resetForm();
        setShowForm(false);
        setEditingProvider(null);
      }
    } catch (error) {
      console.error('Failed to save provider:', error);
    } finally {
      setLoading(false);
    }
  };

  const testProvider = async (provider: AiProvider | null = null) => {
    const testData = provider || formData;
    const testId = provider ? provider.id : 'form';
    setTestingProvider(testId);
    setTestResult(null);

    try {
      const res = await fetch('/api/superadmin/ai-providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: testData.type,
          apiKey: testData.apiKey,
          baseUrl: testData.baseUrl,
          model: testData.model,
        }),
      });

      const result = await res.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Test failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      });
    } finally {
      setTestingProvider(null);
    }
  };

  const deleteProvider = async (id: string) => {
    if (!confirm('Are you sure you want to delete this AI provider?')) return;

    try {
      const res = await fetch(`/api/superadmin/ai-providers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadProviders();
      }
    } catch (error) {
      console.error('Failed to delete provider:', error);
    }
  };

  const editProvider = (provider: AiProvider) => {
    setEditingProvider(provider);
    setFormData({
      type: provider.type,
      displayName: provider.displayName,
      apiKey: provider.apiKey || '',
      baseUrl: provider.baseUrl || '',
      model: provider.model,
      config: provider.config ? JSON.stringify(provider.config, null, 2) : '',
      isActive: provider.isActive,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      type: '',
      displayName: '',
      apiKey: '',
      baseUrl: '',
      model: '',
      config: '',
      isActive: false,
    });
    setTestResult(null);
  };

  const getProviderTypeOptions = () => [
    { value: 'OPENAI', label: 'OpenAI' },
    { value: 'GEMINI', label: 'Google Gemini' },
    { value: 'OLLAMA', label: 'Ollama' },
  ];

  const getModelSuggestions = (type: string) => {
    switch (type) {
      case 'OPENAI':
        return ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];
      case 'GEMINI':
        return ['gemini-pro', 'gemini-pro-vision'];
      case 'OLLAMA':
        return ['llama2', 'codellama', 'mistral', 'gemma'];
      default:
        return [];
    }
  };

  const getModelPlaceholder = (type: string) => {
    const suggestions = getModelSuggestions(type);
    if (suggestions.length === 0) return 'Select provider type first';
    return `e.g., ${suggestions.join(', ')}`;
  };

  if (loading && providers.length === 0) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Providers</h1>
          <p className="text-gray-400 mt-1">Manage global AI providers for the platform</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Provider
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {providers.map((provider) => (
          <Card key={provider.id} className="relative">
            {provider.isActive && (
              <div className="absolute top-4 right-4">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
            )}
            
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white">{provider.displayName}</h3>
                <p className="text-sm text-gray-400">{provider.type}</p>
                <p className="text-xs text-gray-500 mt-1">Model: {provider.model}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="text-xs">
                <span className="text-gray-400">Status: </span>
                <span className={provider.isActive ? 'text-emerald-400' : 'text-gray-500'}>
                  {provider.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {provider.baseUrl && (
                <div className="text-xs">
                  <span className="text-gray-400">Endpoint: </span>
                  <span className="text-gray-300">{provider.baseUrl}</span>
                </div>
              )}
              <div className="text-xs">
                <span className="text-gray-400">API Key: </span>
                <span className="text-gray-300">
                  {provider.apiKey ? '••••••••' : 'Not required'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => testProvider(provider)}
                loading={testingProvider === provider.id}
              >
                <TestTube className="w-3 h-3 mr-1" />
                Test
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => editProvider(provider)}
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => deleteProvider(provider.id)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {providers.length === 0 && (
        <Card className="text-center py-12">
          <Settings className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No AI Providers</h3>
          <p className="text-gray-400 mb-4">Add your first AI provider to enable AI-powered risk analysis</p>
          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Provider
          </Button>
        </Card>
      )}

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingProvider(null); resetForm(); }}
        title={editingProvider ? 'Edit AI Provider' : 'Add AI Provider'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Provider Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value, model: '' })}
            options={getProviderTypeOptions()}
            required
          />

          <Input
            label="Display Name"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            placeholder="e.g., OpenAI GPT-4"
            required
          />

          {formData.type && (
            <>
              <Input
                label="Model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder={getModelPlaceholder(formData.type)}
                required
              />

              {formData.type !== 'OLLAMA' && (
                <Input
                  label="API Key"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="Your API key"
                  required={formData.type !== 'OLLAMA'}
                />
              )}

              {formData.type === 'OLLAMA' && (
                <>
                  <Input
                    label="Base URL"
                    value={formData.baseUrl}
                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                    placeholder="e.g., http://localhost:11434 or http://100.67.174.92:11434"
                  />
                  <Input
                    label="API Key (Optional)"
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="For cloud/tunnel Ollama instances"
                  />
                </>
              )}
            </>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="isActive" className="text-sm text-gray-300">
              Set as active provider
            </label>
          </div>

          {testResult && (
            <div className={`p-3 rounded-lg ${testResult.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              <div className="flex items-center gap-2">
                {testResult.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span className="text-sm">{testResult.message}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => testProvider()}
              loading={testingProvider === 'form'}
              disabled={!formData.type || !formData.model}
            >
              <TestTube className="w-4 h-4 mr-2" />
              Test Connection
            </Button>
            <Button type="submit" loading={loading}>
              {editingProvider ? 'Update' : 'Add'} Provider
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}