'use client';

import { useEffect, useState } from 'react';

interface SubscriptionRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  comments: string | null;
  status: string;
  created_at: string;
  policies_accepted_at: string | null;
  plan_id: string | null;
  plan_name?: string;
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [reqRes, plansRes] = await Promise.all([
      fetch(`/api/admin/subscription-requests?status=${filter}`),
      fetch('/api/admin/plans'),
    ]);
    const reqs: SubscriptionRequest[] = reqRes.ok ? await reqRes.json() : [];
    const plans: { id: string; name: string }[] = plansRes.ok ? await plansRes.json() : [];
    const planMap = Object.fromEntries(plans.map((p) => [p.id, p.name]));
    setRequests(reqs.map((r) => ({ ...r, plan_name: r.plan_id ? planMap[r.plan_id] : undefined })));
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function handleAction(req: SubscriptionRequest, action: 'approve' | 'reject') {
    if (action === 'approve' && !confirm(`Approve ${req.name} (${req.email}) and create their teacher account?`)) return;
    setActing(req.id);
    const res = await fetch(`/api/admin/subscription-requests/${req.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setActing(null);
    if (!res.ok) {
      alert(data.error ?? 'Action failed');
    } else {
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Teacher Requests</h1>
        <div className="flex gap-2">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-sm px-3 py-1.5 rounded-lg capitalize transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No {filter} requests.</div>
        ) : requests.map((req) => (
          <div key={req.id} className="px-5 py-4 flex items-start justify-between gap-4">
            <div className="space-y-0.5 min-w-0">
              <p className="text-sm font-medium text-gray-900">{req.name}</p>
              <p className="text-xs text-gray-500">{req.email}</p>
              {req.phone && <p className="text-xs text-gray-400">{req.phone}</p>}
              {req.plan_name && (
                <span className="inline-block text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full mt-1">
                  Plan: {req.plan_name}
                </span>
              )}
              {!req.plan_id && (
                <span className="inline-block text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full mt-1">
                  No plan selected
                </span>
              )}
              {req.comments && (
                <p className="text-xs text-gray-500 mt-1 italic">{req.comments}</p>
              )}
              <p className="text-xs text-gray-300 mt-1">
                Submitted: {new Date(req.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              {req.policies_accepted_at ? (
                <p className="text-xs text-green-600 mt-0.5">
                  ✓ Policies accepted {new Date(req.policies_accepted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              ) : (
                <p className="text-xs text-amber-500 mt-0.5">⚠ Policies not confirmed</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {req.status === 'pending' ? (
                <>
                  <button
                    onClick={() => handleAction(req, 'approve')}
                    disabled={acting === req.id}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {acting === req.id ? '...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleAction(req, 'reject')}
                    disabled={acting === req.id}
                    className="text-xs border border-red-300 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    Reject
                  </button>
                </>
              ) : (
                <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                  req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {req.status}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
