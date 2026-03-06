'use client';

import { useState } from 'react';
import { Shield, TrendingUp, BarChart3, Users, CheckCircle, ArrowRight, Play, Mail, Building2, User } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

export default function LandingPage() {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    jobTitle: '',
    phone: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        company: '',
        jobTitle: '',
        phone: '',
        message: '',
      });

      // Auto close after 3 seconds
      setTimeout(() => {
        setShowRequestModal(false);
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'AI Risk Intelligence',
      description: 'Leverage advanced AI to identify and assess risks across your development lifecycle.',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Real-time Analytics',
      description: 'Get instant insights into release stability, user journey performance, and risk trends.',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Smart Dashboard',
      description: 'Visualize your risk landscape with intuitive charts and actionable recommendations.',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Team Collaboration',
      description: 'Enable your entire team to make data-driven decisions with role-based access control.',
    },
  ];

  const benefits = [
    'Reduce production incidents by up to 40%',
    'Accelerate release cycles with confidence',
    'Improve user experience and retention',
    'Make data-driven product decisions',
    'Scale your development processes safely',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent-blue flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">DevRisk AI</h1>
              <p className="text-xs text-gray-500">Risk Intelligence Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </a>
            <Button
              onClick={() => setShowRequestModal(true)}
              size="sm"
            >
              Request Demo
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            AI-Powered Risk Intelligence
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-blue">
              for Scaling Teams
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 leading-relaxed max-w-3xl mx-auto">
            Make smarter product decisions with real-time risk analytics. DevRisk AI helps engineering teams 
            identify potential issues before they impact users, accelerating safe development at scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => setShowRequestModal(true)}
              size="lg"
              className="gap-2 px-8 py-4 text-lg"
            >
              <Play className="w-5 h-5" />
              Request Demo
            </Button>
            <a
              href="/login"
              className="text-gray-300 hover:text-white transition-colors flex items-center gap-2"
            >
              Already have an account? <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why DevRisk AI?
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Transform how your team manages risk with intelligent insights and proactive recommendations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-surface border border-border hover:border-primary/30 transition-colors"
            >
              <div className="text-primary mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Trusted by High-Growth Teams
            </h2>
            <p className="text-lg text-gray-400 mb-8">
              Join innovative companies who rely on DevRisk AI to ship faster and safer.
            </p>
            <ul className="space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="text-gray-300">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-surface border border-border rounded-xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Ready to get started?
              </h3>
              <p className="text-gray-400 mb-6">
                Book a personalized demo and see how DevRisk AI can transform your development process.
              </p>
              <Button
                onClick={() => setShowRequestModal(true)}
                className="w-full"
                size="lg"
              >
                Request Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface/30 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-blue flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">DevRisk AI</span>
          </div>
          <p className="text-sm text-gray-500">
            © 2026 DevRisk AI. AI Risk Intelligence for Scaling Product Teams.
          </p>
        </div>
      </footer>

      {/* Request Demo Modal */}
      <Modal
        open={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Request Demo"
        size="lg"
      >
        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Thank you for your interest!
            </h3>
            <p className="text-gray-400">
              We've received your demo request and will contact you within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
              />
              <Input
                label="Work Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@company.com"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Company"
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Acme Corp"
                required
              />
              <Input
                label="Job Title"
                type="text"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="Engineering Manager"
              />
            </div>

            <Input
              label="Phone (Optional)"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tell us about your needs
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="What challenges are you facing with risk management? How many developers on your team?"
                rows={3}
                className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="px-4 py-2 rounded-lg text-gray-300 hover:bg-surface-2 transition-colors"
              >
                Cancel
              </button>
              <Button
                type="submit"
                disabled={loading || !formData.name || !formData.email || !formData.company}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
