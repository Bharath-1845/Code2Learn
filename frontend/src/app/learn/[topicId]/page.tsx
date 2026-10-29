'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { curriculumApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, CheckCircle, ArrowRight, Sparkles, HelpCircle, AlertCircle, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;
  const { addXp } = useAuth();

  const [lesson, setLesson] = useState<any>(null);
  const [practices, setPractices] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [practiceFeedback, setPracticeFeedback] = useState<any>(null);
  const [practicePassed, setPracticePassed] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadLessonAndPractice();
  }, [topicId]);

  const loadLessonAndPractice = async () => {
    try {
      const [les, pracs] = await Promise.all([
        curriculumApi.getLesson(topicId),
        curriculumApi.getMiniPractices(topicId),
      ]);
      setLesson(les);
      setPractices(pracs);
      // Mark lesson as completed and check if practice was already passed
      curriculumApi.completeLesson(topicId).then((res) => {
        if (res?.practice_completed) {
          setPracticePassed(true);
        }
        if (res?.xp_awarded && res.xp_awarded > 0) {
          addXp(res.xp_awarded);
        }
      }).catch(() => {});
    } catch (err) {
      console.error('Failed to load lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (practiceId: string, option: any) => {
    setAnswers((prev) => ({ ...prev, [practiceId]: option }));
  };

  const handleSubmitPractices = async () => {
    setSubmitting(true);
    try {
      const res = await curriculumApi.submitMiniPractices(topicId, answers);
      setPracticeFeedback(res.feedback);
      setPracticePassed(res.passed);
      setXpAwarded(res.xp_awarded || 0);

      if (res.passed) {
        if (res.xp_awarded && res.xp_awarded > 0) {
          addXp(res.xp_awarded);
        }
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
    } catch (err) {
      console.error('Error submitting practice:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <div style={{ fontSize: '2.5rem', animation: 'pulseGlow 1.5s infinite' }}>📖</div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Preparing Python Lesson...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '860px' }}>
      {/* Lesson Navigation Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <Link href="/worlds" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ← Back to World Map
        </Link>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="badge badge-xp">Step 1: Learn & Practice</span>
          {practicePassed || practices.length === 0 ? (
            <Link href={`/game/${topicId}`} className="badge badge-success" style={{ textDecoration: 'none' }}>
              Next: Play Game 🎮
            </Link>
          ) : (
            <span className="badge badge-locked" style={{ opacity: 0.6, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={12} /> Next: Game Locked
            </span>
          )}
        </div>
      </div>

      {/* Lesson Content Box */}
      {lesson && (
        <div className="glass-panel" style={{ padding: '36px', marginBottom: '32px' }}>
          <div style={{
            fontSize: '1.05rem',
            lineHeight: 1.8,
            color: 'var(--text-main)',
            whiteSpace: 'pre-wrap',
            fontFamily: 'var(--font-main)'
          }}>
            {lesson.content_markdown}
          </div>
        </div>
      )}

      {/* Mini-Practice Section */}
      {practices && practices.length > 0 && (
        <div className="glass-panel" style={{ padding: '36px', marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <HelpCircle size={22} color="var(--color-accent-gold)" />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              Mini Practice Check
            </h2>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '28px' }}>
            Solve these rapid checks to verify your understanding before entering the game arena.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {practices.map((practice, pIdx) => {
              const fb = practiceFeedback?.[practice.id];
              return (
                <div
                  key={practice.id}
                  style={{
                    background: 'var(--bg-muted)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '24px'
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>
                    QUESTION {pIdx + 1}
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>
                    {practice.prompt}
                  </h3>

                  {practice.code_snippet && (
                    <pre style={{
                      background: 'var(--bg-app)',
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.95rem',
                      fontFamily: 'var(--font-code)',
                      overflowX: 'auto',
                      marginBottom: '18px',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <code>{practice.code_snippet}</code>
                    </pre>
                  )}

                  {/* Options */}
                  {practice.options && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {practice.options.map((opt: any, optIdx: number) => {
                        const isSelected = answers[practice.id] === opt;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(practice.id, opt)}
                            style={{
                              textAlign: 'left',
                              padding: '12px 18px',
                              borderRadius: 'var(--radius-sm)',
                              background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface)',
                              border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                              color: 'var(--text-main)',
                              fontWeight: isSelected ? 600 : 400,
                              fontSize: '0.95rem',
                              transition: 'all var(--transition-fast)'
                            }}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Feedback Message */}
                  {fb && (
                    <div style={{
                      marginTop: '16px',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-sm)',
                      background: fb.correct ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      border: `1px solid ${fb.correct ? '#10b981' : '#ef4444'}`,
                      color: fb.correct ? '#10b981' : '#ef4444',
                      fontSize: '0.9rem'
                    }}>
                      <strong>{fb.correct ? '✓ Correct!' : '✗ Not quite.'}</strong> {fb.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <button
              onClick={handleSubmitPractices}
              disabled={submitting}
              className="btn-primary"
              style={{ padding: '12px 28px' }}
            >
              <span>{submitting ? 'Checking...' : 'Check My Answers'}</span>
              <CheckCircle size={18} />
            </button>

            {practicePassed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--color-accent-green)', fontWeight: 600 }}>
                  🎉 Practice Passed! {xpAwarded > 0 ? `(+${xpAwarded} XP)` : ''}
                </span>
                <Link href={`/game/${topicId}`} className="btn-success">
                  <span>Enter Game Arena</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
