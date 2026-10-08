'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { progressApi, aiApi } from '@/lib/api';
import {
  Trophy,
  Flame,
  Zap,
  Compass,
  ArrowRight,
  Sparkles,
  BarChart2,
  CheckCircle,
  Clock,
  BookOpen
} from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadDashboard();
    }
  }, [user, authLoading]);

  const loadDashboard = async () => {
    try {
      const [dash, rec] = await Promise.all([
        progressApi.getDashboard(),
        aiApi.getRecommendation().catch(() => null),
      ]);
      setData(dash);
      setRecommendation(rec);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <div style={{ fontSize: '2.5rem', animation: 'pulseGlow 1.5s infinite' }}>🐍</div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading your Python stats...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <p>Could not load dashboard data. Please try logging in again.</p>
        <Link href="/login" className="btn-primary" style={{ marginTop: '20px' }}>
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            fontSize: '2.4rem',
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'var(--bg-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-md)'
          }}>
            {data.avatar || '🐍'}
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              Welcome back, {data.username}! 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{data.level_title}</span> • Mode: Beginner
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/worlds" className="btn-primary">
            <Compass size={18} />
            <span>Continue Journey</span>
          </Link>
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {/* Level & XP */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>PLAYER LEVEL</span>
            <Zap size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>Level {data.level}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {data.xp} Total XP ({data.xp_to_next_level} XP to Level {data.level + 1})
          </div>
          {/* Progress bar */}
          <div style={{
            width: '100%',
            height: '8px',
            background: 'var(--bg-subtle)',
            borderRadius: '999px',
            overflow: 'hidden',
            marginTop: '12px'
          }}>
            <div style={{
              width: `${data.xp_progress_percentage}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #f59e0b, #10b981)',
              borderRadius: '999px',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* Streak */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>STREAK</span>
            <Flame size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444' }}>
            {data.streak_days} Day{data.streak_days === 1 ? '' : 's'} 🔥
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Daily commitment bonus active
          </div>
        </div>

        {/* Topics Mastered */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>MASTERY</span>
            <CheckCircle size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>
            {data.mastered_topics_count} / {data.total_topics_count}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {data.overall_progress_percentage}% Beginner Realm conquered
          </div>
        </div>
      </div>

      {/* Main Grid: Current Node & AI Recommendation */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Current Active Quest */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'var(--color-primary)' }}>
            <BookOpen size={18} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase' }}>Current Objective</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>
            {data.current_topic_title || 'Introduction to Python'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '20px' }}>
            World: {data.current_world_name || 'Python Foundations'}
          </p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link
              href={`/learn/${data.current_topic_id || 'topic-intro-python'}`}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>Start Learning / Practice</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* AI Learning Recommendation */}
        {recommendation && (
          <div className="glass-panel" style={{
            padding: '28px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(16, 185, 129, 0.04))'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--color-primary)' }}>
              <Sparkles size={18} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase' }}>AI Tutor Guidance</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
              {recommendation.recommended_topic_title}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '12px' }}>
              {recommendation.reason}
            </p>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600, marginBottom: '18px' }}>
              💡 {recommendation.suggested_action}
            </div>
            <Link
              href={`/learn/${recommendation.recommended_topic_id}`}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.9rem' }}
            >
              <span>Practice Recommended Concept</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>

      {/* Two Column Section: Skill Profile & Achievements */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px'
      }}>
        {/* Python Skill Profile */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <BarChart2 size={20} color="var(--color-accent-cyan)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Python Skill Profile</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.skills?.map((skill: any) => (
              <div key={skill.topic_id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  <span>{skill.topic_title}</span>
                  <span style={{ color: skill.percentage >= 70 ? 'var(--color-accent-green)' : 'var(--text-muted)' }}>
                    {skill.percentage}%
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '7px',
                  background: 'var(--bg-muted)',
                  borderRadius: '999px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.max(skill.percentage, 5)}%`,
                    height: '100%',
                    background: skill.percentage >= 70 ? 'var(--color-accent-green)' : 'var(--color-primary)',
                    borderRadius: '999px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Trophy size={20} color="#f59e0b" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Badges & Achievements</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px' }}>
            {data.recent_achievements?.map((ach: any) => (
              <div
                key={ach.id}
                style={{
                  background: ach.unlocked ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-muted)',
                  border: `1px solid ${ach.unlocked ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 12px',
                  textAlign: 'center',
                  opacity: ach.unlocked ? 1 : 0.5
                }}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{ach.icon}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '2px' }}>{ach.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {ach.unlocked ? `+${ach.xp_bonus} XP` : 'Locked'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
