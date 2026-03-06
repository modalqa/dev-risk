'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Mail, 
  Building2, 
  Phone, 
  Calendar, 
  MessageCircle, 
  Edit2, 
  Trash2, 
  Filter,
  CheckCircle,
  Clock,
  AlertCircle 
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  jobTitle?: string;
  phone?: string;
  message?: string;
  status: string;
  source: string;
  assignedTo?: string;
  notes?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface LeadStats {
  new: number;
  contacted: number;
  qualified: number;
  demo: number;
  closed: number;
}

const statusColors = {
  NEW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  CONTACTED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  QUALIFIED: 'bg-green-500/20 text-green-400 border-green-500/30',
  DEMO_SCHEDULED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  DEMO_COMPLETED: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  PROPOSAL_SENT: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  NEGOTIATION: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  CLOSED_WON: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  CLOSED_LOST: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusOptions = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'DEMO_SCHEDULED', label: 'Demo Scheduled' },
  { value: 'DEMO_COMPLETED', label: 'Demo Completed' },
  { value: 'PROPOSAL_SENT', label: 'Proposal Sent' },
  { value: 'NEGOTIATION', label: 'Negotiation' },
  { value: 'CLOSED_WON', label: 'Closed Won' },
  { value: 'CLOSED_LOST', label: 'Closed Lost' },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats>({ new: 0, contacted: 0, qualified: 0, demo: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [editForm, setEditForm] = useState({
    status: '',
    notes: '',
    assignedTo: '',
    followUpDate: '',
  });

  useEffect(() => {
    loadLeads();
  }, [statusFilter]);

  const loadLeads = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      
      const res = await fetch(`/api/superadmin/leads?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setEditForm({
      status: lead.status,
      notes: lead.notes || '',
      assignedTo: lead.assignedTo || '',
      followUpDate: lead.followUpDate ? lead.followUpDate.split('T')[0] : '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    try {
      const res = await fetch('/api/superadmin/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: editingLead.id,
          ...editForm,
          followUpDate: editForm.followUpDate || null,
        }),
      });

      if (res.ok) {
        await loadLeads();
        setShowEditModal(false);
        setEditingLead(null);
      }
    } catch (error) {
      console.error('Failed to update lead:', error);
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const res = await fetch(`/api/superadmin/leads?id=${leadId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadLeads();
      }
    } catch (error) {
      console.error('Failed to delete lead:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface rounded w-1/3"></div>
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-surface rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Lead Management</h1>
          <p className="text-sm text-gray-400">Manage demo requests and potential customers</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'New', value: stats.new, color: 'text-blue-400', icon: AlertCircle },
          { label: 'Contacted', value: stats.contacted, color: 'text-yellow-400', icon: Mail },
          { label: 'Qualified', value: stats.qualified, color: 'text-green-400', icon: CheckCircle },
          { label: 'Demo Scheduled', value: stats.demo, color: 'text-purple-400', icon: Calendar },
          { label: 'Closed', value: stats.closed, color: 'text-gray-400', icon: Users },
        ].map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-surface border border-border rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          >
            <option value="ALL">All Status</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Contact</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Company</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Source</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-border/50 hover:bg-surface-light/50">
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-sm font-medium text-white">{lead.name}</p>
                      <p className="text-xs text-gray-400">{lead.email}</p>
                      {lead.phone && (
                        <p className="text-xs text-gray-500">{lead.phone}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-sm text-white">{lead.company}</p>
                      {lead.jobTitle && (
                        <p className="text-xs text-gray-400">{lead.jobTitle}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs border ${statusColors[lead.status as keyof typeof statusColors]}`}>
                      {statusOptions.find(s => s.value === lead.status)?.label || lead.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-300">{lead.source}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-300">{formatDate(lead.createdAt)}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(lead)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-surface-2 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-surface-2 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {leads.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No leads found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Lead: ${editingLead?.name}`}
        size="md"
      >
        {editingLead && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="p-4 bg-surface-2 rounded-lg">
              <p className="text-sm text-gray-300 mb-1">Contact: {editingLead.email}</p>
              <p className="text-sm text-gray-300">Company: {editingLead.company}</p>
              {editingLead.message && (
                <div className="mt-3 p-3 bg-surface rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Message:</p>
                  <p className="text-sm text-gray-300">{editingLead.message}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Assigned To"
              type="text"
              value={editForm.assignedTo}
              onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
              placeholder="john@company.com"
            />

            <Input
              label="Follow Up Date"
              type="date"
              value={editForm.followUpDate}
              onChange={(e) => setEditForm({ ...editForm, followUpDate: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Add notes about this lead..."
                rows={3}
                className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-lg text-gray-300 hover:bg-surface-2 transition-colors"
              >
                Cancel
              </button>
              <Button type="submit">Update Lead</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}