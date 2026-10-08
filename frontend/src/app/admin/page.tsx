'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/lib/api';
import { Shield, Users, BarChart3, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
      return;
    }

    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user, authLoading]);

  const loadAdminData = async () => {
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

  if (authLoading || loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <div style={{ fontSize: '2.5rem', animation: 'pulseGlow 1.5s infinite' }}>🛡️</div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading Admin Portal...</p>
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
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => handleToggleStatus(u.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-muted)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: u.is_active ? '#ef4444' : '#10b981'
                      }}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
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
