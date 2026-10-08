'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { assessmentApi } from '@/lib/api';
import confetti from 'canvas-confetti';
import { Brain, CheckCircle, AlertCircle, ArrowRight, Clock, Award, RotateCcw } from 'lucide-react';

export default function AssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;

  const [assessment, setAssessment] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(600);

  useEffect(() => {
    loadAssessment();
  }, [topicId]);

  useEffect(() => {
    if (loading || result) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, result]);

  const loadAssessment = async () => {
    try {
      const a = await assessmentApi.getAssessment(topicId);
      setAssessment(a);
      setTimeLeftSeconds((a.time_limit_minutes || 10) * 60);
    } catch (err) {
      console.error('Failed to load assessment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (qId: string, ans: any) => {
    setAnswers((prev) => ({ ...prev, [qId]: ans }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = assessment.questions.map((q: any) => ({
        question_id: q.id,
        answer: answers[q.id] || '',
      }));
      const res = await assessmentApi.submitAssessment(topicId, payload);
      setResult(res);

      if (res.passed) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error('Error submitting assessment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <div style={{ fontSize: '2.5rem', animation: 'pulseGlow 1.5s infinite' }}>🧠</div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Preparing Adaptive Assessment...</p>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <p>Assessment not found.</p>
        <Link href="/worlds" className="btn-primary" style={{ marginTop: '20px' }}>
          Back to Worlds
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '820px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Link href={`/code/${topicId}`} style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            ← Back to Challenge
          </Link>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px' }}>
            {assessment.title}
          </h1>
        </div>

        {!result && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-muted)',
            padding: '8px 18px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
            fontWeight: 700,
            color: timeLeftSeconds < 120 ? '#ef4444' : 'var(--text-main)'
          }}>
            <Clock size={16} />
            <span>Time: {formatTime(timeLeftSeconds)}</span>
          </div>
        )}
      </div>

      {/* Main Container */}
      {!result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {assessment.questions.map((q: any, idx: number) => (
            <div key={q.id} className="glass-panel" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  QUESTION {idx + 1} OF {assessment.questions.length}
                </span>
                <span className="badge" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                  {q.difficulty}
                </span>
              </div>

              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '14px' }}>
                {q.prompt}
              </h2>

              {q.code_snippet && (
                <pre style={{
                  background: 'var(--bg-app)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-code)',
                  marginBottom: '18px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <code>{q.code_snippet}</code>
                </pre>
              )}

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {q.options?.map((opt: any, optIdx: number) => {
                  const isChecked = answers[q.id] === opt;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectAnswer(q.id, opt)}
                      style={{
                        textAlign: 'left',
                        padding: '12px 18px',
                        borderRadius: 'var(--radius-sm)',
                        background: isChecked ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-muted)',
                        border: isChecked ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                        color: 'var(--text-main)',
                        fontSize: '0.95rem',
                        fontWeight: isChecked ? 600 : 400,
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div style={{ textAlign: 'center', marginTop: '16px', marginBottom: '40px' }}>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary"
              style={{ padding: '14px 40px', fontSize: '1.05rem' }}
            >
              <span>{submitting ? 'Submitting & Grading...' : 'Submit Assessment'}</span>
              <CheckCircle size={18} />
            </button>
          </div>
        </div>
      ) : (
        /* Results Screen */
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>
            {result.passed ? '🎉' : '📚'}
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
            {result.passed ? 'Topic Mastered!' : 'Keep Practicing!'}
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '24px' }}>
            Score: <strong style={{ color: result.passed ? '#10b981' : '#ef4444' }}>{result.score_percentage}%</strong> (Passing threshold: {result.passing_threshold}%)
          </p>

          {result.xp_earned > 0 && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              padding: '10px 24px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              fontSize: '1.1rem',
              marginBottom: '32px'
            }}>
              <Award size={20} />
              <span>+{result.xp_earned} XP Awarded!</span>
            </div>
          )}

          {/* Feedback Breakdown */}
          <div style={{ textAlign: 'left', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Question Review</h3>
            {result.feedback?.map((fb: any, i: number) => (
              <div
                key={i}
                style={{
                  background: 'var(--bg-muted)',
                  borderLeft: `4px solid ${fb.is_correct ? '#10b981' : '#ef4444'}`,
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '4px' }}>
                  {fb.is_correct ? <CheckCircle size={16} color="#10b981" /> : <AlertCircle size={16} color="#ef4444" />}
                  <span>Question {i + 1}: {fb.is_correct ? 'Correct' : 'Incorrect'}</span>
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>{fb.explanation}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <Link href="/worlds" className="btn-secondary">
              <span>Return to World Map</span>
            </Link>

            {result.passed ? (
              <Link href="/dashboard" className="btn-primary">
                <span>View Dashboard</span>
                <ArrowRight size={18} />
              </Link>
            ) : (
              <button onClick={() => { setResult(null); loadAssessment(); }} className="btn-primary">
                <RotateCcw size={16} />
                <span>Retry Assessment</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
