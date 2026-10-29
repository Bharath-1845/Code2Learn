'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { challengeApi, aiApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import confetti from 'canvas-confetti';
import { Play, Check, Lightbulb, Sparkles, AlertCircle, CheckCircle, ArrowRight, Terminal, Lock } from 'lucide-react';

// Dynamic import Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function CodeChallengePage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;
  const { addXp } = useAuth();

  const [challenge, setChallenge] = useState<any>(null);
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [submitResult, setSubmitResult] = useState<any>(null);

  // AI Hint state
  const [hintLevel, setHintLevel] = useState(1);
  const [hintText, setHintText] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);

  // Concept question state
  const [selectedConceptAnswer, setSelectedConceptAnswer] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [lockError, setLockError] = useState('');

  useEffect(() => {
    loadChallenge();
  }, [topicId]);

  const loadChallenge = async () => {
    setLoading(true);
    setLockError('');
    try {
      const c = await challengeApi.getChallenge(topicId);
      setChallenge(c);
      setCode(c.starter_code || '# Write your Python code here\n');
    } catch (err: any) {
      console.error('Failed to load challenge:', err);
      setLockError(err.message || 'Coding challenge is locked. Complete the interactive game first!');
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await challengeApi.runCode(code);
      setRunResult(res);
    } catch (err: any) {
      setRunResult({ stderr: err.message, exit_code: 1 });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await challengeApi.submitChallenge(
        challenge.id,
        code,
        selectedConceptAnswer || undefined
      );
      setSubmitResult(res);

      if (res.passed) {
        if (res.xp_earned && res.xp_earned > 0) {
          addXp(res.xp_earned, res.new_level);
        }
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err: any) {
      console.error('Error submitting code:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestHint = async (level: number) => {
    setHintLoading(true);
    try {
      const res = await aiApi.getHint(challenge.id, code, level);
      setHintText(res.hint);
      setHintLevel(level);
    } catch (err) {
      setHintText('Think about what the challenge asks you to calculate and return.');
    } finally {
      setHintLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <div style={{ fontSize: '2.5rem', animation: 'pulseGlow 1.5s infinite' }}>💻</div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading Code Sandbox...</p>
      </div>
    );
  }

  if (lockError) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '600px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '10px' }}>Coding Challenge Locked</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {lockError}
        </p>
        <Link href={`/game/${topicId}`} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span>Go to Interactive Game</span>
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <p>Challenge not found.</p>
        <Link href="/worlds" className="btn-primary" style={{ marginTop: '20px' }}>
          Back to Worlds
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1280px' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href={`/game/${topicId}`} style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            ← Back to Game
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{challenge.title}</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="badge badge-xp">+{challenge.xp_reward} XP</span>
          <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-primary)' }}>
            {challenge.difficulty.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Main Split Layout: Left Instructions, Right Editor */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 420px) 1fr',
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* Left Column: Instructions, Test Cases, AI Hints */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Instructions Box */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px' }}>Instructions</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '14px' }}>
              {challenge.description}
            </p>
            <div style={{
              background: 'var(--bg-muted)',
              borderLeft: '4px solid var(--color-primary)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              color: 'var(--text-main)'
            }}>
              <strong>Requirement:</strong> {challenge.instructions}
            </div>
          </div>

          {/* Test Cases Overview */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>Test Cases</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {challenge.test_cases?.map((tc: any, tcIdx: number) => (
                <div
                  key={tc.id}
                  style={{
                    background: 'var(--bg-muted)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-code)'
                  }}
                >
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '2px' }}>
                    Case {tcIdx + 1}
                  </div>
                  <div>Expected: <span style={{ color: 'var(--color-accent-green)' }}>{tc.expected_output}</span></div>
                </div>
              ))}
            </div>
          </div>

          {/* Progressive AI Hint Drawer */}
          <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                <Lightbulb size={18} />
                <span>AI Socratic Hint</span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => handleRequestHint(lvl)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: hintLevel === lvl && hintText ? 'var(--color-primary)' : 'var(--bg-muted)',
                      color: hintLevel === lvl && hintText ? '#fff' : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    L{lvl}
                  </button>
                ))}
              </div>
            </div>

            {hintLoading ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Consulting AI tutor...</p>
            ) : hintText ? (
              <div style={{
                background: 'rgba(99, 102, 241, 0.08)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                color: 'var(--text-main)',
                lineHeight: 1.5
              }}>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Hint (Level {hintLevel}): </span>
                {hintText}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Stuck? Click Level 1, 2, or 3 for progressive clues that won't give away the solution.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Monaco Code Editor + Output Terminal + Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Editor Container */}
          <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
            {/* Editor Toolbar */}
            <div style={{
              background: 'var(--bg-muted)',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                <Terminal size={16} color="var(--color-primary)" />
                <span>solution.py (Python 3.10)</span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleRun}
                  disabled={running || submitting}
                  className="btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                >
                  <Play size={14} />
                  <span>{running ? 'Running...' : 'Run Code'}</span>
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || running}
                  className="btn-primary"
                  style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                >
                  <Check size={14} />
                  <span>{submitting ? 'Evaluating...' : 'Submit'}</span>
                </button>
              </div>
            </div>

            {/* Monaco Editor Component */}
            <div style={{ height: '360px' }}>
              <MonacoEditor
                height="100%"
                language="python"
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  insertSpaces: true,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              />
            </div>
          </div>

          {/* Live Run Output Console */}
          {runResult && (
            <div className="glass-panel" style={{ padding: '18px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                <span>Execution Output</span>
                <span style={{ color: 'var(--text-muted)' }}>{runResult.execution_time_ms} ms</span>
              </div>
              <pre style={{
                background: 'var(--bg-app)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                fontFamily: 'var(--font-code)',
                color: runResult.stderr ? '#ef4444' : 'var(--text-main)',
                maxHeight: '160px',
                overflowY: 'auto'
              }}>
                {runResult.stderr || runResult.stdout || '(No output produced)'}
              </pre>
            </div>
          )}

          {/* Evaluation Results Card */}
          {submitResult && (
            <div className="glass-panel" style={{
              padding: '24px',
              border: submitResult.passed ? '2px solid #10b981' : '2px solid #ef4444'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {submitResult.passed ? (
                    <CheckCircle size={24} color="#10b981" />
                  ) : (
                    <AlertCircle size={24} color="#ef4444" />
                  )}
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                      {submitResult.passed ? '🎉 All Test Cases Passed!' : 'Some Test Cases Failed'}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Passed {submitResult.passed_test_cases} of {submitResult.total_test_cases} test cases
                    </p>
                  </div>
                </div>

                {submitResult.xp_earned > 0 && (
                  <span className="badge badge-xp" style={{ fontSize: '1rem', padding: '6px 14px' }}>
                    +{submitResult.xp_earned} XP
                  </span>
                )}
              </div>

              {/* Conceptual Check if available */}
              {challenge.post_concept_question && submitResult.passed && (
                <div style={{
                  background: 'var(--bg-muted)',
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '6px' }}>
                    Quick Conceptual Check
                  </div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px' }}>
                    {challenge.post_concept_question.question}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {challenge.post_concept_question.options.map((opt: string, i: number) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedConceptAnswer(opt)}
                        style={{
                          textAlign: 'left',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: selectedConceptAnswer === opt ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface)',
                          border: selectedConceptAnswer === opt ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                          fontSize: '0.85rem',
                          color: 'var(--text-main)'
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Step Button */}
              {submitResult.passed && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <Link href={`/assess/${topicId}`} className="btn-success">
                    <span>Advance to Topic Assessment</span>
                    <ArrowRight size={18} />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
