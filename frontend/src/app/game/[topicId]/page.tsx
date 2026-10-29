'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { challengeApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import confetti from 'canvas-confetti';
import { Gamepad2, Trophy, ArrowRight, Zap, CheckCircle2, RotateCcw, Lock, Sparkles } from 'lucide-react';
import RedBallGame from '../../../components/game/RedBallGame';
import FroggyGame from '../../../components/game/FroggyGame';

export default function GamePage() {
  const params = useParams();
  const topicId = params.topicId as string;
  const { addXp } = useAuth();

  const [game, setGame] = useState<any>(null);
  const [activeGameMode, setActiveGameMode] = useState<'redball' | 'froggy' | 'classic'>('redball');

  // Classic Quiz Arena State
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Common completion state
  const [gameOver, setGameOver] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lockError, setLockError] = useState('');

  useEffect(() => {
    loadGame();
  }, [topicId]);

  const loadGame = async () => {
    setLoading(true);
    setLockError('');
    try {
      const g = await challengeApi.getGame(topicId);
      setGame(g);
    } catch (err: any) {
      console.error('Failed to load game:', err);
      setLockError(err.message || 'Game arena is locked. Please complete the lesson first.');
    } finally {
      setLoading(false);
    }
  };

  const handleGameComplete = async (finalRatio = 1.0) => {
    setGameOver(true);
    const passed = finalRatio >= 0.6;

    if (passed) {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
      });
    }

    if (game?.id) {
      try {
        const res = await challengeApi.submitGame(game.id, finalRatio, passed);
        const earned = res.xp_earned || 0;
        setXpEarned(earned);
        if (earned > 0) {
          addXp(earned);
        }
      } catch (e) {
        console.error('Error submitting game score:', e);
      }
    } else {
      // Award baseline game completion XP
      addXp(50);
      setXpEarned(50);
    }
  };

  // Classic Mode Question parser
  const getQuestions = () => {
    if (!game?.config) return [];
    if (game.config.rounds) return game.config.rounds;
    if (game.config.battles) {
      return game.config.battles.map((b: any) => ({
        prompt: `Make it true: ${b.left} ___ ${b.right} == ${b.target}`,
        options: b.options,
        correct: b.correct,
      }));
    }
    if (game.config.items) {
      return game.config.items.map((it: any) => ({
        prompt: `Sort data into Python type: ${it.value}`,
        options: ['int', 'float', 'str', 'bool'],
        correct: it.type,
      }));
    }
    if (game.config.gears) {
      return game.config.gears.map((g: any) => ({
        prompt: `How many rotations does gear '${g.range}' make?`,
        options: ['3', '4', '5', '6'],
        correct: String(g.rotations),
      }));
    }
    if (game.config.puzzles) {
      return game.config.puzzles.map((p: any) => ({
        prompt: `Evaluate: ${p.operation} → What is ${p.target}?`,
        options: ['1', '2', '3', '75'],
        correct: String(p.answer),
      }));
    }
    return [];
  };

  const questions = getQuestions();
  const currentQ = questions[currentRound];

  const handleSelectClassic = (opt: string) => {
    if (isAnswerChecked || !currentQ) return;
    setSelectedOption(opt);
    const correct = String(opt).trim().toLowerCase() === String(currentQ.correct).trim().toLowerCase();
    setIsCorrect(correct);
    setIsAnswerChecked(true);

    if (correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextClassic = async () => {
    if (currentRound + 1 < questions.length) {
      setCurrentRound((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      const finalRatio = (score + (isCorrect ? 1 : 0)) / questions.length;
      handleGameComplete(finalRatio);
    }
  };

  const handleRestartClassic = () => {
    setCurrentRound(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setGameOver(false);
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <div style={{ fontSize: '2.5rem', animation: 'pulseGlow 1.5s infinite' }}>🎮</div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Booting Game Arena...</p>
      </div>
    );
  }

  if (lockError) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '600px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '10px' }}>Game Arena Locked</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {lockError}
        </p>
        <Link href={`/learn/${topicId}`} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span>Go to Lesson & Practice</span>
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '860px' }}>
      {/* Top Header Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Link href={`/learn/${topicId}`} style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          ← Back to Lesson
        </Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-xp">Step 2: Interactive Game</span>
          <span className="badge badge-success">+{game?.xp_reward || 50} XP</span>
        </div>
      </div>

      {/* Aesthetic Game Mode Switcher Tab Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '24px',
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(12px)',
          padding: '6px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          flexWrap: 'wrap',
        }}
      >
        {/* Red Ball Tab */}
        <button
          onClick={() => {
            setActiveGameMode('redball');
            setGameOver(false);
          }}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            background: activeGameMode === 'redball' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
            border: activeGameMode === 'redball' ? '1px solid #ef4444' : '1px solid transparent',
            color: activeGameMode === 'redball' ? '#f87171' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>🔴</span>
          <span>Red Ball Runner</span>
        </button>

        {/* Python Froggy Tab */}
        <button
          onClick={() => {
            setActiveGameMode('froggy');
            setGameOver(false);
          }}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            background: activeGameMode === 'froggy' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            border: activeGameMode === 'froggy' ? '1px solid #10b981' : '1px solid transparent',
            color: activeGameMode === 'froggy' ? '#34d399' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>🐸</span>
          <span>Python Froggy</span>
        </button>

        {/* Classic Arena Tab */}
        {questions.length > 0 && (
          <button
            onClick={() => {
              setActiveGameMode('classic');
              setGameOver(false);
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              background: activeGameMode === 'classic' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              border: activeGameMode === 'classic' ? '1px solid #6366f1' : '1px solid transparent',
              color: activeGameMode === 'classic' ? '#818cf8' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>⚡</span>
            <span>Arena Quiz</span>
          </button>
        )}
      </div>

      {/* Main Game Stage */}
      {activeGameMode === 'redball' && (
        <RedBallGame topicId={topicId} onComplete={handleGameComplete} />
      )}

      {activeGameMode === 'froggy' && (
        <FroggyGame topicId={topicId} onComplete={handleGameComplete} />
      )}

      {activeGameMode === 'classic' && (
        <div className="glass-panel" style={{ padding: '36px', position: 'relative', overflow: 'hidden' }}>
          {/* Game Title & Score Banner */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <Gamepad2 size={24} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{game?.title || 'Arena Challenge'}</h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{game?.description || 'Select correct Python statements'}</p>
              </div>
            </div>

            {!gameOver && questions.length > 0 && (
              <div
                style={{
                  background: 'var(--bg-muted)',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Zap size={16} color="#f59e0b" />
                <span>
                  Round {currentRound + 1} / {questions.length}
                </span>
              </div>
            )}
          </div>

          {!gameOver ? (
            currentQ && (
              <div>
                <div
                  style={{
                    background: 'var(--bg-muted)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '30px 24px',
                    textAlign: 'center',
                    marginBottom: '24px',
                  }}
                >
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>
                    {currentQ.prompt}
                  </h2>
                </div>

                {/* Answer Options */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                  {currentQ.options?.map((opt: string, optIdx: number) => {
                    const isChosen = selectedOption === opt;
                    let bg = 'var(--bg-muted)';
                    let border = '1px solid var(--border-subtle)';

                    if (isAnswerChecked) {
                      if (String(opt).trim().toLowerCase() === String(currentQ.correct).trim().toLowerCase()) {
                        bg = 'rgba(16, 185, 129, 0.2)';
                        border = '2px solid #10b981';
                      } else if (isChosen) {
                        bg = 'rgba(239, 68, 68, 0.2)';
                        border = '2px solid #ef4444';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        disabled={isAnswerChecked}
                        onClick={() => handleSelectClassic(opt)}
                        style={{
                          padding: '16px',
                          borderRadius: 'var(--radius-sm)',
                          background: bg,
                          border: border,
                          color: 'var(--text-main)',
                          fontSize: '1rem',
                          fontWeight: 600,
                          cursor: isAnswerChecked ? 'default' : 'pointer',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Next Round Button */}
                {isAnswerChecked && (
                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button onClick={handleNextClassic} className="btn-primary" style={{ padding: '12px 32px' }}>
                      <span>{currentRound + 1 < questions.length ? 'Next Mission Round' : 'Complete Arena'}</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            )
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '14px' }}>🏆</div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>
                Arena Conquered!
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '20px' }}>
                You scored {score} out of {questions.length} rounds.
              </p>

              <button onClick={handleRestartClassic} className="btn-secondary" style={{ marginRight: '12px' }}>
                <RotateCcw size={16} />
                <span>Replay Arena</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Global Progression Footer (Unlocks Coding Challenge) */}
      <div
        style={{
          marginTop: '28px',
          padding: '20px 24px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={20} color="var(--color-accent-green)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
              Ready for the Real Code Sandbox?
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Complete any game mode above to advance directly into Step 3: Coding Challenge!
            </div>
          </div>
        </div>

        <Link
          href={`/code/${topicId}`}
          className="btn-primary"
          style={{
            padding: '12px 24px',
            fontSize: '0.92rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>Go to Coding Challenge</span>
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
