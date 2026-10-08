'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { challengeApi } from '@/lib/api';
import confetti from 'canvas-confetti';
import { Gamepad2, Trophy, ArrowRight, Zap, CheckCircle2, RotateCcw } from 'lucide-react';

export default function GamePage() {
  const params = useParams();
  const topicId = params.topicId as string;

  const [game, setGame] = useState<any>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGame();
  }, [topicId]);

  const loadGame = async () => {
    try {
      const g = await challengeApi.getGame(topicId);
      setGame(g);
    } catch (err) {
      console.error('Failed to load game:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSelect = (opt: string) => {
    if (isAnswerChecked) return;
    setSelectedOption(opt);
    const correct = String(opt).trim().toLowerCase() === String(currentQ.correct).trim().toLowerCase();
    setIsCorrect(correct);
    setIsAnswerChecked(true);

    if (correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = async () => {
    if (currentRound + 1 < questions.length) {
      setCurrentRound((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      // Game finished
      setGameOver(true);
      const finalRatio = (score + (isCorrect ? 1 : 0)) / questions.length;
      const passed = finalRatio >= 0.6;

      if (passed) {
        confetti({
          particleCount: 75,
          spread: 80,
          origin: { y: 0.6 }
        });
      }

      try {
        const res = await challengeApi.submitGame(game.id, finalRatio, passed);
        setXpEarned(res.xp_earned || 0);
      } catch (e) {
        console.error('Error submitting game score:', e);
      }
    }
  };

  const handleRestart = () => {
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

  if (!game || questions.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <p>Game is not yet configured for this topic.</p>
        <Link href={`/code/${topicId}`} className="btn-primary" style={{ marginTop: '20px' }}>
          Proceed to Coding Challenge
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '780px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <Link href={`/learn/${topicId}`} style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          ← Back to Lesson
        </Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-xp">Step 2: Interactive Game</span>
          <span className="badge badge-success">+{game.xp_reward} XP</span>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '36px', position: 'relative', overflow: 'hidden' }}>
        {/* Game Title & Score Banner */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Gamepad2 size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{game.title}</h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{game.description}</p>
            </div>
          </div>

          {!gameOver && (
            <div style={{
              background: 'var(--bg-muted)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.9rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Zap size={16} color="#f59e0b" />
              <span>Round {currentRound + 1} / {questions.length}</span>
            </div>
          )}
        </div>

        {/* Gameplay Body */}
        {!gameOver ? (
          <div>
            <div style={{
              background: 'var(--bg-muted)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '30px 24px',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
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
                    onClick={() => handleSelect(opt)}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-sm)',
                      background: bg,
                      border: border,
                      color: 'var(--text-main)',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: isAnswerChecked ? 'default' : 'pointer',
                      transition: 'all var(--transition-fast)'
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
                <button onClick={handleNext} className="btn-primary" style={{ padding: '12px 32px' }}>
                  <span>{currentRound + 1 < questions.length ? 'Next Mission Round' : 'Complete Arena'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Game Over Screen */
          <div style={{ textAlign: 'center', padding: '30px 20px' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '14px' }}>
              {score >= questions.length * 0.6 ? '🏆' : '🎯'}
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>
              {score >= questions.length * 0.6 ? 'Arena Conquered!' : 'Good Effort! Try Again?'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '20px' }}>
              You scored {score} out of {questions.length} rounds.
            </p>

            {xpEarned > 0 && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                padding: '8px 20px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '1.1rem',
                marginBottom: '28px'
              }}>
                <Zap size={20} />
                <span>+{xpEarned} XP Awarded!</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button onClick={handleRestart} className="btn-secondary">
                <RotateCcw size={16} />
                <span>Replay Game</span>
              </button>

              <Link href={`/code/${topicId}`} className="btn-primary" style={{ padding: '12px 28px' }}>
                <span>Next: Solve Coding Challenge</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
