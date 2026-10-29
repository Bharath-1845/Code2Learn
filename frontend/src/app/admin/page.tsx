'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminApi, authApi } from '@/lib/api';
import { Shield, Users, BarChart3, CheckCircle2, AlertTriangle, ArrowRight, Trash2, LogIn } from 'lucide-react';

export default function AdminPage() {
  const { user, loading: authLoading, login } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user?.role === 'admin') {
      loadAdminData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [st, uList] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers(),
      ]);
      setStats(st);
      setUsers(uList);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      await adminApi.toggleUser(userId);
      loadAdminData();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${username}"? This will remove all their progress and attempts.`)) {
      return;
    }
    try {
      await adminApi.deleteUser(userId);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleQuickAdminLogin = async () => {
    setSwitching(true);
    try {
      const res = await authApi.login({
        username_or_email: 'admin@code2learn.com',
        password: 'admin123'
      });
      login(res.access_token, res.refresh_token, res.user);
    } catch (err: any) {
      alert(err.message || 'Failed to switch to admin account.');
    } finally {
      setSwitching(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <div style={{ fontSize: '2.5rem', animation: 'pulseGlow 1.5s infinite' }}>🛡️</div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading Admin Portal...</p>
      </div>
    );
  }

  // If not logged in as admin, show clear access control UI instead of a silent redirect
  if (!user || user.role !== 'admin') {
    return (
      <div className="container" style={{ maxWidth: '640px', padding: '80px 20px', textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <Shield size={32} />
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '10px' }}>
          Admin Privileges Required
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
          {user ? (
            <>You are currently signed in as <strong>{user.username}</strong> ({user.email}), which has a <strong>{user.role}</strong> role. Only administrators can view and manage platform users.</>
          ) : (
            <>You are not logged in. Please sign in with an administrator account to view the platform portal.</>
          )}
        </p>

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleQuickAdminLogin}
            disabled={switching}
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <LogIn size={18} />
            <span>{switching ? 'Signing in...' : 'Sign In as Admin (One Click)'}</span>
          </button>
          <Link href="/dashboard" className="btn-secondary">
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Admin Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-accent-gold)'
          }}>
            <Shield size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Platform Administration</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Monitor student engagement, code executions, and platform metrics
            </p>
          </div>
        </div>

        <Link href="/dashboard" className="btn-secondary">
          <span>Exit to Dashboard</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
          marginBottom: '36px'
        }}>
          <div className="glass-panel" style={{ padding: '22px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL LEARNERS</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px' }}>{stats.total_users}</div>
          </div>

          <div className="glass-panel" style={{ padding: '22px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>CODE SUBMISSIONS</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px' }}>{stats.total_challenge_submissions}</div>
          </div>

          <div className="glass-panel" style={{ padding: '22px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>SUCCESS RATE</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
              {stats.success_rate}%
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '22px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOPICS MASTERED</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>
              {stats.total_topics_mastered}
            </div>
          </div>
        </div>
      )}

      {/* Learners Management Table */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '20px' }}>
          Registered Students
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>Username</th>
                <th style={{ padding: '12px 16px' }}>Email</th>
                <th style={{ padding: '12px 16px' }}>Role</th>
                <th style={{ padding: '12px 16px' }}>Level</th>
                <th style={{ padding: '12px 16px' }}>XP</th>
                <th style={{ padding: '12px 16px' }}>Streak</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>{u.username}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="badge" style={{
                      background: u.role === 'admin' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-muted)',
                      color: u.role === 'admin' ? '#f59e0b' : 'var(--text-main)'
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>Lvl {u.level}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--color-accent-gold)', fontWeight: 600 }}>
                    {u.xp} XP
                  </td>
                  <td style={{ padding: '14px 16px' }}>{u.streak_days}d 🔥</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ color: u.is_active ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={() => handleToggleStatus(u.id)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-muted)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: u.is_active ? '#ef4444' : '#10b981',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer'
                      }}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    {u.id !== user?.id && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        title={`Delete ${u.username}`}
                        style={{
                          padding: '5px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(239, 68, 68, 0.12)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
