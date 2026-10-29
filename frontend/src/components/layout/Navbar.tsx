'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Flame, Trophy, Compass, LayoutDashboard, Shield, LogOut } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--bg-surface-glass)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '12px 0'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #10b981)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
          }}>
            🐍
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.5px' }}>
            Code<span style={{ color: 'var(--color-primary)' }}>2</span>Learn
          </span>
        </Link>

        {/* Center Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              fontWeight: 500,
              color: pathname === '/dashboard' ? 'var(--color-primary)' : 'var(--text-secondary)',
              background: pathname === '/dashboard' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              transition: 'all var(--transition-fast)'
            }}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/worlds"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              fontWeight: 500,
              color: pathname.startsWith('/worlds') ? 'var(--color-primary)' : 'var(--text-secondary)',
              background: pathname.startsWith('/worlds') ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              transition: 'all var(--transition-fast)'
            }}
          >
            <Compass size={18} />
            <span>World Map</span>
          </Link>

          {user?.role === 'admin' && (
            <Link
              href="/admin"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: pathname.startsWith('/admin') ? 'var(--color-accent-gold)' : 'var(--text-secondary)',
                background: pathname.startsWith('/admin') ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                transition: 'all var(--transition-fast)'
              }}
            >
              <Shield size={18} />
              <span>Admin</span>
            </Link>
          )}
        </div>

        {/* Right Info & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {user ? (
            <>
              {/* Streak */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}
                title="Daily Learning Streak"
              >
                <Flame size={16} fill="#ef4444" />
                <span>{user.profile?.streak_days || 1}d</span>
              </div>

              {/* Level & XP */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'all 0.3s ease'
                }}
              >
                <span>{user.profile?.avatar || '🐍'}</span>
                <span>Lvl {user.profile?.level || 1}</span>
                <span style={{ color: 'var(--color-accent-gold)', fontWeight: 700 }}>★ {user.profile?.xp ?? 0} XP</span>
              </div>

              {/* User Dropdown / Logout */}
              <button
                onClick={logout}
                title="Sign out"
                style={{
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color var(--transition-fast)'
                }}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link href="/login" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Log In
              </Link>
              <Link href="/register" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Sign Up
              </Link>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            <div className="theme-icon-wrapper">
              {theme === 'dark' ? (
                <Sun size={19} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.5))' }} />
              ) : (
                <Moon size={19} color="#6366f1" style={{ filter: 'drop-shadow(0 0 4px rgba(99, 102, 241, 0.5))' }} />
              )}
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
}
