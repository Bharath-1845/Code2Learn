'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { curriculumApi, challengeApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Lock, CheckCircle, ChevronRight, Swords, Sparkles, Trophy } from 'lucide-react';

export default function WorldsPage() {
  const { user } = useAuth();
  const [worlds, setWorlds] = useState<any[]>([]);
  const [bossInfo, setBossInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorlds();
  }, [user]);

  const loadWorlds = async () => {
    try {
      const [wList, bData] = await Promise.all([
        curriculumApi.getWorlds('beginner'),
        challengeApi.getBossBattle('world-7-functions').catch(() => null),
      ]);
      setWorlds(wList);
      setBossInfo(bData);
    } catch (err) {
      console.error('Failed to load worlds:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <div style={{ fontSize: '2.5rem', animation: 'pulseGlow 1.5s infinite' }}>🌐</div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Mapping the Python Realm...</p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 48px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(16, 185, 129, 0.12)',
          color: '#10b981',
          padding: '6px 16px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '16px'
        }}>
          <Sparkles size={16} />
          <span>Realm 1: Python Fundamentals</span>
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '12px' }}>
          The Beginner World Map
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          Conquer each world sequentially by mastering lessons, mini-practices, interactive games, and coding challenges. Defeat the final Boss to unlock Intermediate Mode!
        </p>
      </div>

      {/* Worlds Timeline Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '840px', margin: '0 auto' }}>
        {worlds.map((world, idx) => {
          const isUnlocked = world.is_unlocked;
          const isCompleted = world.is_completed;

          return (
            <div
              key={world.id}
              className="glass-panel"
              style={{
                padding: '28px',
                position: 'relative',
                overflow: 'hidden',
                opacity: isUnlocked ? 1 : 0.6,
                borderLeft: `6px solid ${world.theme_color || '#6366f1'}`,
                transition: 'transform var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '18px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px',
                    background: `${world.theme_color}22`,
                    border: `1px solid ${world.theme_color}55`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    flexShrink: 0
                  }}>
                    {world.icon}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: world.theme_color, textTransform: 'uppercase' }}>
                        WORLD {world.world_number}
                      </span>
                      {isCompleted ? (
                        <span className="badge badge-success">
                          <CheckCircle size={14} /> Mastered
                        </span>
                      ) : isUnlocked ? (
                        <span className="badge badge-xp">
                          In Progress
                        </span>
                      ) : (
                        <span className="badge badge-locked">
                          <Lock size={14} /> Locked
                        </span>
                      )}
                    </div>

                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>
                      {world.name}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '540px' }}>
                      {world.description}
                    </p>
                  </div>
                </div>

                {/* Right Action */}
                <div>
                  {isUnlocked ? (
                    <Link
                      href={`/learn/${world.topics[0]?.id || ''}`}
                      className="btn-primary"
                      style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                    >
                      <span>Enter World</span>
                      <ChevronRight size={16} />
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="btn-secondary"
                      style={{ padding: '10px 20px', fontSize: '0.9rem', opacity: 0.6, cursor: 'not-allowed' }}
                    >
                      <Lock size={16} />
                      <span>Locked</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Topics Breakdown Bar */}
              {world.topics && world.topics.length > 0 && isUnlocked && (
                <div style={{
                  marginTop: '22px',
                  paddingTop: '18px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Core Topic: <strong style={{ color: 'var(--text-main)' }}>{world.topics[0]?.title}</strong>
                  </div>

                  {/* Fast Action Links for Topic */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Link
                      href={`/learn/${world.topics[0]?.id}`}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-muted)',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                    >
                      📚 Lesson
                    </Link>
                    <Link
                      href={`/game/${world.topics[0]?.id}`}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: 'var(--color-primary)',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                    >
                      🎮 Play Game
                    </Link>
                    <Link
                      href={`/code/${world.topics[0]?.id}`}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: 'var(--color-accent-green)',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                    >
                      💻 Coding Challenge
                    </Link>
                    <Link
                      href={`/assess/${world.topics[0]?.id}`}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(245, 158, 11, 0.1)',
                        color: 'var(--color-accent-gold)',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                    >
                      🧠 Assessment
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Grand Beginner Boss Battle Card */}
        {bossInfo && (
          <div
            className="glass-panel"
            style={{
              padding: '32px',
              border: '2px solid rgba(236, 72, 153, 0.4)',
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(99, 102, 241, 0.1))',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{
                  fontSize: '3rem',
                  width: '74px',
                  height: '74px',
                  borderRadius: '20px',
                  background: 'rgba(236, 72, 153, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(236, 72, 153, 0.3)'
                }}>
                  {bossInfo.boss_avatar || '🐉'}
                </div>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ec4899', fontWeight: 700, fontSize: '0.85rem' }}>
                    <Swords size={16} />
                    <span>GRAND FINALE: BEGINNER BOSS BATTLE</span>
                  </div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0' }}>
                    {bossInfo.title}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '520px' }}>
                    {bossInfo.storyline}
                  </p>
                </div>
              </div>

              <div>
                <Link
                  href="/boss/world-7-functions"
                  className="btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                    padding: '14px 28px',
                    fontSize: '1rem',
                    boxShadow: '0 6px 20px rgba(236, 72, 153, 0.4)'
                  }}
                >
                  <Swords size={18} />
                  <span>Challenge Boss (+{bossInfo.xp_reward} XP)</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
