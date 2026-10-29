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
                  {isUnlocked ? (() => {
                    const t = world.topics[0];
                    let resumeHref = `/learn/${t?.id || ''}`;
                    if (t?.lesson_completed && t?.practice_completed && !t?.game_completed) {
                      resumeHref = `/game/${t.id}`;
                    } else if (t?.game_completed && !t?.challenge_completed) {
                      resumeHref = `/code/${t.id}`;
                    } else if (t?.challenge_completed && !t?.assessment_completed) {
                      resumeHref = `/assess/${t.id}`;
                    }
                    return (
                      <Link
                        href={resumeHref}
                        className="btn-primary"
                        style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                      >
                        <span>Enter World</span>
                        <ChevronRight size={16} />
                      </Link>
                    );
                  })() : (
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
              {world.topics && world.topics.length > 0 && isUnlocked && (() => {
                const t = world.topics[0];
                const isLessonDone = Boolean(t.lesson_completed && t.practice_completed);
                const isGameUnlocked = isLessonDone;
                const isChallengeUnlocked = Boolean(t.game_completed);
                const isAssessmentUnlocked = Boolean(t.challenge_completed);

                return (
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
                      Core Topic: <strong style={{ color: 'var(--text-main)' }}>{t.title}</strong>
                    </div>

                    {/* Step-by-Step Sequenced Links for Topic */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Step 1: Lesson */}
                      <Link
                        href={`/learn/${t.id}`}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: isLessonDone ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-muted)',
                          color: isLessonDone ? 'var(--color-accent-green)' : 'var(--text-main)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          border: isLessonDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {isLessonDone ? <CheckCircle size={12} /> : null}
                        <span>{isLessonDone ? 'Lesson' : '📚 Lesson'}</span>
                      </Link>

                      {/* Step 2: Play Game */}
                      {isGameUnlocked ? (
                        <Link
                          href={`/game/${t.id}`}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: t.game_completed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                            color: t.game_completed ? 'var(--color-accent-green)' : 'var(--color-primary)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            border: t.game_completed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {t.game_completed ? <CheckCircle size={12} /> : null}
                          <span>{t.game_completed ? 'Play Game' : '🎮 Play Game'}</span>
                        </Link>
                      ) : (
                        <span
                          title="Complete Lesson & Practice first to unlock"
                          style={{
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-muted)',
                            color: 'var(--text-muted)',
                            opacity: 0.5,
                            cursor: 'not-allowed',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          <Lock size={12} />
                          <span>Play Game</span>
                        </span>
                      )}

                      {/* Step 3: Coding Challenge */}
                      {isChallengeUnlocked ? (
                        <Link
                          href={`/code/${t.id}`}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: t.challenge_completed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                            color: 'var(--color-accent-green)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {t.challenge_completed ? <CheckCircle size={12} /> : null}
                          <span>{t.challenge_completed ? 'Coding Challenge' : '💻 Coding Challenge'}</span>
                        </Link>
                      ) : (
                        <span
                          title="Complete Game Arena first to unlock"
                          style={{
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-muted)',
                            color: 'var(--text-muted)',
                            opacity: 0.5,
                            cursor: 'not-allowed',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          <Lock size={12} />
                          <span>Coding Challenge</span>
                        </span>
                      )}

                      {/* Step 4: Assessment */}
                      {isAssessmentUnlocked ? (
                        <Link
                          href={`/assess/${t.id}`}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: t.assessment_completed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                            color: t.assessment_completed ? 'var(--color-accent-green)' : 'var(--color-accent-gold)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            border: t.assessment_completed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {t.assessment_completed ? <CheckCircle size={12} /> : null}
                          <span>{t.assessment_completed ? 'Assessment' : '🧠 Assessment'}</span>
                        </Link>
                      ) : (
                        <span
                          title="Complete Coding Challenge first to unlock"
                          style={{
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-muted)',
                            color: 'var(--text-muted)',
                            opacity: 0.5,
                            cursor: 'not-allowed',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          <Lock size={12} />
                          <span>Assessment</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })}

        {/* Grand Beginner Boss Battle Card */}
        {bossInfo && (() => {
          const allWorldsCompleted = worlds.length > 0 && worlds.every(w => w.is_completed);
          return (
            <div
              className="glass-panel"
              style={{
                padding: '32px',
                border: allWorldsCompleted ? '2px solid rgba(236, 72, 153, 0.4)' : '1px solid var(--border-subtle)',
                background: allWorldsCompleted
                  ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(99, 102, 241, 0.1))'
                  : 'var(--bg-muted)',
                position: 'relative',
                opacity: allWorldsCompleted ? 1 : 0.65
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{
                    fontSize: '3rem',
                    width: '74px',
                    height: '74px',
                    borderRadius: '20px',
                    background: allWorldsCompleted ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: allWorldsCompleted ? '0 8px 24px rgba(236, 72, 153, 0.3)' : 'none'
                  }}>
                    {bossInfo.boss_avatar || '🐉'}
                  </div>
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: allWorldsCompleted ? '#ec4899' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem' }}>
                      <Swords size={16} />
                      <span>GRAND FINALE: BEGINNER BOSS BATTLE</span>
                      {!allWorldsCompleted && (
                        <span className="badge badge-locked" style={{ marginLeft: '8px' }}>
                          <Lock size={12} /> Locked
                        </span>
                      )}
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
                  {allWorldsCompleted ? (
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
                  ) : (
                    <button
                      disabled
                      className="btn-secondary"
                      style={{ padding: '12px 24px', fontSize: '0.9rem', opacity: 0.6, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Lock size={16} />
                      <span>Locked (Complete All 7 Worlds)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
