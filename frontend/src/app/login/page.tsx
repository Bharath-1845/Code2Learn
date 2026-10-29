'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Shield,
  GraduationCap,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState<'student' | 'admin' | null>(null);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (loginIdent: string, loginPass: string) => {
    setError('');
    try {
      const res = await authApi.login({ email: loginIdent, password: loginPass });
      login(res.access_token, res.refresh_token, {
        id: res.user_id,
        username: res.username,
        role: res.role,
      });
      router.push('/dashboard');
    } catch (err: any) {
      if (err.message?.includes('Failed to fetch') || err.message?.includes('Network request failed')) {
        setError('Cannot connect to the backend server. Please verify backend is running on http://localhost:8000');
      } else {
        setError(err.message || 'Invalid username or password. Please verify your credentials.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await handleLogin(identifier, password);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = async (role: 'student' | 'admin') => {
    setSelectedDemoRole(role);
    setDemoLoading(role);
    const demoId = role === 'student' ? 'student@code2learn.com' : 'admin@code2learn.com';
    const demoPw = role === 'student' ? 'student123' : 'admin123';

    setIdentifier(demoId);
    setPassword(demoPw);

    try {
      await handleLogin(demoId, demoPw);
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div style={{
      position: 'relative',
      minHeight: '84vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      overflow: 'hidden'
    }}>
      {/* Ambient Radial Mesh Spotlights */}
      <div
        className="auth-ambient-glow"
        style={{
          width: '420px',
          height: '420px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(99, 102, 241, 0) 70%)',
          top: '5%',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />
      <div
        className="auth-ambient-glow"
        style={{
          width: '320px',
          height: '320px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(16, 185, 129, 0) 70%)',
          bottom: '8%',
          right: '25%',
        }}
      />

      {/* Main Glass Card */}
      <div
        className="auth-glass-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '40px 36px',
          zIndex: 1,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              boxShadow: '0 10px 28px -4px rgba(99, 102, 241, 0.45)',
            }}>
              🐍
            </div>
          </div>

          <h1 style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            marginBottom: '6px',
            background: 'linear-gradient(180deg, var(--text-main) 40%, var(--text-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Welcome Back
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Sign in to continue your Python journey
          </p>
        </div>

        {/* 1-Click Fast Access Pill Bar */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          padding: '6px',
          marginBottom: '26px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 8px 8px',
            fontSize: '0.76rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Sparkles size={13} color="var(--color-primary)" />
              1-Click Instant Access
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-accent-green)' }}>Active</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {/* Student Pill */}
            <button
              type="button"
              disabled={loading || !!demoLoading}
              onClick={() => handleSelectDemo('student')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '10px',
                background: selectedDemoRole === 'student' ? 'rgba(99, 102, 241, 0.22)' : 'var(--bg-muted)',
                border: `1px solid ${selectedDemoRole === 'student' ? 'var(--color-primary)' : 'transparent'}`,
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {demoLoading === 'student' ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <GraduationCap size={16} color="var(--color-primary)" />
              )}
              <span>Student</span>
            </button>

            {/* Admin Pill */}
            <button
              type="button"
              disabled={loading || !!demoLoading}
              onClick={() => handleSelectDemo('admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '10px',
                background: selectedDemoRole === 'admin' ? 'rgba(16, 185, 129, 0.22)' : 'var(--bg-muted)',
                border: `1px solid ${selectedDemoRole === 'admin' ? 'var(--color-accent-green)' : 'transparent'}`,
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {demoLoading === 'admin' ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <Shield size={16} color="var(--color-accent-green)" />
              )}
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            padding: '12px 14px',
            borderRadius: '12px',
            fontSize: '0.86rem',
            marginBottom: '22px',
            lineHeight: 1.5
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit}>
          {/* Email / Username Field */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              marginBottom: '7px'
            }}>
              Email or Username
            </label>
            <div className="auth-input-container">
              <Mail size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <input
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@code2learn.com or username"
              />
            </div>
          </div>

          {/* Password Field with Show/Hide Toggle */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
              <label style={{
                fontSize: '0.84rem',
                fontWeight: 600,
                color: 'var(--text-main)',
              }}>
                Password
              </label>
              <span
                onClick={() => alert('For password resets, contact your administrator at admin@code2learn.com.')}
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Forgot password?
              </span>
            </div>

            <div className="auth-input-container">
              <Lock size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  outline: 'none'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <input
              type="checkbox"
              id="remember-me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                accentColor: 'var(--color-primary)',
                cursor: 'pointer'
              }}
            />
            <label
              htmlFor="remember-me"
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              Remember this device
            </label>
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={loading || !!demoLoading}
            className="btn-auth-submit"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div style={{
          textAlign: 'center',
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)'
        }}>
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            style={{
              color: 'var(--color-primary)',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            Create an account
          </Link>
        </div>

        {/* Trust & Security Tag */}
        <div style={{
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <CheckCircle2 size={13} color="var(--color-accent-green)" />
          <span>Python 3.11 Execution • End-to-End Encrypted</span>
        </div>
      </div>
    </div>
  );
}
