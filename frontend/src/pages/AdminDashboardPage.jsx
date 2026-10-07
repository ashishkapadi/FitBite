import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  FileText, 
  Search,
  Lock,
  RotateCcw
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, token, openAuthModal, login } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('sellers'); // 'sellers' | 'users' | 'orders' | 'logs'
  const [metrics, setMetrics] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Seller filter
  const [sellerFilter, setSellerFilter] = useState('all');

  useEffect(() => {
    if (!user) {
      return;
    }
    if (user.role !== 'admin') {
      alert('Access restricted to FitBite System Administrators.');
      navigate('/');
      return;
    }
    fetchAdminData();
  }, [user]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMetrics(),
        fetchSellers(),
        fetchUsers(),
        fetchOrders(),
        fetchAuditLogs()
      ]);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    const res = await fetch('/api/admin/metrics', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setMetrics(await res.json());
  };

  const fetchSellers = async () => {
    const res = await fetch('/api/admin/sellers', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setSellers(await res.json());
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setUsersList(await res.json());
  };

  const fetchOrders = async () => {
    const res = await fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setOrdersList(await res.json());
  };

  const fetchAuditLogs = async () => {
    const res = await fetch('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setAuditLogs(await res.json());
  };

  const handleVerifySeller = async (sellerId, action) => {
    let rejectionReason = null;
    if (action === 'reject' || action === 'suspend') {
      rejectionReason = window.prompt(`Please provide a reason for ${action}ing this kitchen:`);
      if (!rejectionReason) return;
    }

    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, rejection_reason: rejectionReason })
      });
      if (res.ok) {
        fetchSellers();
        fetchMetrics();
        fetchAuditLogs();
        alert(`Seller status successfully updated!`);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update seller');
      }
    } catch (err) {
      alert('Error updating seller verification');
    }
  };

  const handleToggleUserStatus = async (userId, currentActive) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !currentActive })
      });
      if (res.ok) {
        fetchUsers();
        fetchAuditLogs();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update user status');
      }
    } catch (err) {
      alert('Error toggling user account status');
    }
  };

  const handleProcessRefund = async (orderId) => {
    const reason = window.prompt('Enter reason for issuing customer refund:');
    if (!reason) return;

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        alert('Refund processed successfully.');
        fetchOrders();
        fetchMetrics();
        fetchAuditLogs();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to process refund');
      }
    } catch (err) {
      alert('Error initiating refund');
    }
  };

  const handleQuickAdminLogin = async () => {
    await login('admin@fitbite.demo', 'FitBite@Admin2026');
  };

  if (!user || user.role !== 'admin') {
    return (
      <div style={{ maxWidth: '600px', margin: '5rem auto', textAlign: 'center', padding: '2rem', background: '#FFFFFF', borderRadius: '1.25rem', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <Lock size={48} color="#D97706" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem' }}>
          Administrator Authentication Required
        </h2>
        <p style={{ color: '#4B5563', margin: '0 0 1.5rem', lineHeight: '1.5' }}>
          This screen manages platform-wide seller compliance, FSSAI reviews, and financial oversight. Please sign in with administrator credentials.
        </p>

        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#334155', textAlign: 'left' }}>
          <div><b>Demo Admin Account:</b> admin@fitbite.demo</div>
          <div><b>Password:</b> FitBite@Admin2026</div>
        </div>

        <button className="btn btn-primary" onClick={handleQuickAdminLogin} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
          1-Click Admin Sign In
        </button>
      </div>
    );
  }

  const filteredSellers = sellers.filter(s => {
    if (sellerFilter === 'all') return true;
    return s.verification_status === sellerFilter;
  });

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 1rem 5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', background: '#EFF6FF', color: '#1D4ED8', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            <ShieldCheck size={16} /> FitBite Control Plane
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
            Platform Operations & Compliance
          </h1>
          <p style={{ color: '#6B7280', margin: '0.25rem 0 0', fontSize: '0.95rem' }}>
            Logged in as <b>{user.email}</b> (Super Admin)
          </p>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', background: '#F3F4F6', padding: '0.35rem', borderRadius: '0.75rem' }}>
          {[
            { id: 'sellers', label: `Kitchen Verification (${sellers.filter(s => s.verification_status === 'pending_approval').length} Pending)` },
            { id: 'users', label: `Users (${usersList.length})` },
            { id: 'orders', label: `Orders (${ordersList.length})` },
            { id: 'logs', label: 'Audit Trail' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: activeTab === t.id ? '#FFFFFF' : 'transparent',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: activeTab === t.id ? '#111827' : '#6B7280',
                cursor: 'pointer',
                boxShadow: activeTab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Banner */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #E5E7EB' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>PLATFORM GMV</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10B981', marginTop: '0.25rem' }}>
              ₹{metrics.platform_gross_merchandise_value_inr}
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #E5E7EB' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>PENDING KITCHENS</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: metrics.pending_verification_sellers > 0 ? '#DC2626' : '#059669', marginTop: '0.25rem' }}>
              {metrics.pending_verification_sellers}
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #E5E7EB' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>APPROVED KITCHENS</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563EB', marginTop: '0.25rem' }}>
              {metrics.approved_sellers_count}
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #E5E7EB' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>TOTAL ORDERS</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7C3AED', marginTop: '0.25rem' }}>
              {metrics.total_orders_count}
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #E5E7EB' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>ACTIVE SUBSCRIBERS</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#D97706', marginTop: '0.25rem' }}>
              {metrics.active_subscriptions_count}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: SELLER VERIFICATION DESK */}
      {activeTab === 'sellers' && (
        <div style={{ background: '#FFFFFF', borderRadius: '1.25rem', border: '1px solid #E5E7EB', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#111827' }}>
              Seller Verification & FSSAI Desk
            </h2>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['all', 'pending_approval', 'approved', 'rejected', 'suspended'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setSellerFilter(filter)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #E5E7EB',
                    background: sellerFilter === filter ? '#111827' : '#FFFFFF',
                    color: sellerFilter === filter ? '#FFFFFF' : '#4B5563',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {filter.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {filteredSellers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
              No kitchens matching this filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {filteredSellers.map(s => {
                const isPending = s.verification_status === 'pending_approval';
                const isApproved = s.verification_status === 'approved';

                return (
                  <div
                    key={s.id}
                    style={{
                      border: isPending ? '2px solid #F59E0B' : '1px solid #E5E7EB',
                      borderRadius: '1rem',
                      padding: '1.5rem',
                      background: isPending ? '#FFFDF5' : '#FFFFFF'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#111827' }}>
                            {s.business_name}
                          </h3>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: isApproved ? '#ECFDF5' : isPending ? '#FEF3C7' : '#FEE2E2', color: isApproved ? '#047857' : isPending ? '#B45309' : '#B91C1C', textTransform: 'uppercase' }}>
                            {s.verification_status}
                          </span>
                        </div>
                        <div style={{ color: '#4B5563', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                          Type: <b>{s.kitchen_type?.replace(/_/g, ' ')}</b> • Area: <b>{s.area}</b> ({s.pincode})
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {isPending && (
                          <>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleVerifySeller(s.id, 'approve')}
                              style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
                            >
                              Approve Kitchen
                            </button>
                            <button
                              className="btn btn-outline"
                              onClick={() => handleVerifySeller(s.id, 'reject')}
                              style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', color: '#DC2626', borderColor: '#FCA5A5' }}
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            className="btn btn-outline"
                            onClick={() => handleVerifySeller(s.id, 'suspend')}
                            style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', color: '#DC2626', borderColor: '#FCA5A5' }}
                          >
                            Suspend Kitchen
                          </button>
                        )}

                        {!isApproved && !isPending && (
                          <button
                            className="btn btn-outline"
                            onClick={() => handleVerifySeller(s.id, 'reactivate')}
                            style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Compliance details */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', background: '#F8FAFC', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: '#64748B', display: 'block' }}>FSSAI Registration #</span>
                        <span style={{ fontWeight: 700, color: '#0F172A' }}>{s.fssai_number}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block' }}>Delivery Model</span>
                        <span style={{ fontWeight: 700, color: '#0F172A' }}>{s.delivery_model?.replace(/_/g, ' ')}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block' }}>Service Pincodes</span>
                        <span style={{ fontWeight: 700, color: '#0F172A' }}>{Array.isArray(s.service_pincodes) ? s.service_pincodes.join(', ') : 'All Mumbai'}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block' }}>Public Listing</span>
                        <span style={{ fontWeight: 700, color: s.is_listed ? '#059669' : '#DC2626' }}>
                          {s.is_listed ? 'Publicly Searchable' : 'Hidden from Public'}
                        </span>
                      </div>
                    </div>

                    {s.rejection_reason && (
                      <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#DC2626', fontStyle: 'italic' }}>
                        Reason for rejection/suspension: {s.rejection_reason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USERS LIST */}
      {activeTab === 'users' && (
        <div style={{ background: '#FFFFFF', borderRadius: '1.25rem', border: '1px solid #E5E7EB', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 1.5rem', color: '#111827' }}>
            Registered Users ({usersList.length})
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB', color: '#4B5563', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>User</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Registered</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, color: '#111827' }}>{u.full_name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: u.role === 'admin' ? '#FEE2E2' : u.role === 'seller' ? '#FEF3C7' : '#EFF6FF', color: u.role === 'admin' ? '#B91C1C' : u.role === 'seller' ? '#B45309' : '#1D4ED8', textTransform: 'uppercase' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#6B7280', fontSize: '0.85rem' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ color: u.is_active ? '#059669' : '#DC2626', fontWeight: 700 }}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {u.email !== 'admin@fitbite.demo' && (
                        <button
                          className="btn btn-outline"
                          onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                        >
                          {u.is_active ? 'Suspend User' : 'Activate User'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS & REFUND OVERSIGHT */}
      {activeTab === 'orders' && (
        <div style={{ background: '#FFFFFF', borderRadius: '1.25rem', border: '1px solid #E5E7EB', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 1.5rem', color: '#111827' }}>
            System Orders & Financial Oversight ({ordersList.length})
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB', color: '#4B5563', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Order #</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Total</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Delivery Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Payment</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ordersList.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '1rem', fontWeight: 700 }}>
                      #{o.order_number}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#111827' }}>
                      ₹{o.grand_total}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#F3F4F6', color: '#374151', textTransform: 'uppercase' }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ color: o.payment_status === 'refunded' ? '#DC2626' : '#059669', fontWeight: 700 }}>
                        {o.payment_status?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {o.payment_status === 'paid' && (
                        <button
                          className="btn btn-outline"
                          onClick={() => handleProcessRefund(o.id)}
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', color: '#DC2626', borderColor: '#FCA5A5' }}
                        >
                          Issue Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG TRAIL */}
      {activeTab === 'logs' && (
        <div style={{ background: '#FFFFFF', borderRadius: '1.25rem', border: '1px solid #E5E7EB', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 1.5rem', color: '#111827' }}>
            Security & Operations Audit Trail
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {auditLogs.map((log, idx) => (
              <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 800, color: '#0F172A' }}>
                    {log.action}
                  </span>
                  <span style={{ color: '#64748B', fontSize: '0.75rem' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <div style={{ color: '#475569' }}>
                  Actor: <b>{log.actor_email}</b> • Entity: <b>{log.entity_type}</b> ({log.entity_id})
                </div>
                {log.details && (
                  <pre style={{ margin: '0.5rem 0 0', background: '#FFFFFF', padding: '0.5rem', borderRadius: '4px', fontSize: '0.75rem', overflowX: 'auto' }}>
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
