'use client';

import React, { useState } from 'react';
import { ArrowRight, RotateCcw, Sparkles, CheckCircle, Code, HelpCircle, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FroggyGameProps {
  topicId: string;
  onComplete: (score: number) => void;
}

interface FroggyLevel {
  id: number;
  title: string;
  instructions: string;
  frogs: Array<{ id: string; color: 'green' | 'yellow' | 'red'; name: string }>;
  lilypads: Array<{ id: string; color: 'green' | 'yellow' | 'red'; align: 'start' | 'center' | 'end' | 'between' | 'around' }>;
  defaultCode: string;
  correctCode: string[];
  options: string[];
  hint: string;
}

export default function FroggyGame({ topicId, onComplete }: FroggyGameProps) {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [code, setCode] = useState('');
  const [isJumping, setIsJumping] = useState(false);
  const [levelPassed, setLevelPassed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [gameWon, setGameWon] = useState(false);

  // Progressive Python Froggy Levels
  const levels: FroggyLevel[] = [
    {
      id: 1,
      title: 'Level 1: Python Indexing',
      instructions: 'Guide the first frog to the lotus lilypad on the right! In Python, which index accesses the first item of a list?',
      frogs: [{ id: 'f1', color: 'green', name: 'Kermit' }],
      lilypads: [{ id: 'l1', color: 'green', align: 'end' }],
      defaultCode: 'frogs[?].position = "end"',
      correctCode: ['0', 'frogs[0]', 'frogs[0].position = "end"'],
      options: ['frogs[0]', 'frogs[1]', 'frogs[-1]', 'frogs.first()'],
      hint: 'In Python, lists are zero-indexed. The first element is always at index 0.',
    },
    {
      id: 2,
      title: 'Level 2: List Slicing',
      instructions: 'Two frogs need to reach the first two lilypads! Which Python slice notation extracts items from index 0 up to 2?',
      frogs: [
        { id: 'f1', color: 'green', name: 'Lily' },
        { id: 'f2', color: 'yellow', name: 'Sunny' },
      ],
      lilypads: [
        { id: 'l1', color: 'green', align: 'start' },
        { id: 'l2', color: 'yellow', align: 'center' },
      ],
      defaultCode: 'lilypads[?].welcome(frogs)',
      correctCode: ['0:2', ':2', 'lilypads[:2]'],
      options: ['lilypads[0:2]', 'lilypads[1:2]', 'lilypads[0:1]', 'lilypads[2]'],
      hint: 'Slicing syntax is `[start:stop]`. To get the first 2 items, use `0:2` or `[:2]`.',
    },
    {
      id: 3,
      title: 'Level 3: List Filtering with Conditions',
      instructions: 'A red lilypad appeared! Send only the red frog across the pond using Python condition filtering.',
      frogs: [
        { id: 'f1', color: 'green', name: 'Moss' },
        { id: 'f2', color: 'red', name: 'Ruby' },
      ],
      lilypads: [
        { id: 'l1', color: 'red', align: 'end' },
      ],
      defaultCode: '[f for f in frogs if f.color == "?"]',
      correctCode: ['red', '"red"', "'red'", '[f for f in frogs if f.color == "red"]'],
      options: ['f.color == "red"', 'f.color == "green"', 'f.is_red', 'frogs["red"]'],
      hint: 'Compare string values with double equals `== "red"`.',
    },
    {
      id: 4,
      title: 'Level 4: Loop Alignment',
      instructions: 'All frogs want to space out evenly across the pond! Which Python alignment method distributes items evenly?',
      frogs: [
        { id: 'f1', color: 'green', name: 'Pip' },
        { id: 'f2', color: 'yellow', name: 'Squeak' },
        { id: 'f3', color: 'red', name: 'Blaze' },
      ],
      lilypads: [
        { id: 'l1', color: 'green', align: 'between' },
        { id: 'l2', color: 'yellow', align: 'between' },
        { id: 'l3', color: 'red', align: 'between' },
      ],
      defaultCode: 'pond.distribute(mode="?")',
      correctCode: ['space-between', 'between', 'pond.distribute("space-between")'],
      options: ['mode="space-between"', 'mode="flex-start"', 'mode="center"', 'mode="random"'],
      hint: 'The CSS and grid spacing property `space-between` creates even intervals across the container.',
    },
  ];

  const currentLevel = levels[currentLevelIdx];

  const handleSelectOption = (opt: string) => {
    setErrorMsg('');
    const normalized = opt.trim().toLowerCase();
    const isCorrect = currentLevel.correctCode.some(
      (c) => normalized.includes(c.toLowerCase()) || opt === c
    );

    setIsJumping(true);

    setTimeout(() => {
      if (isCorrect) {
        setLevelPassed(true);
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
        });
      } else {
        setIsJumping(false);
        setErrorMsg('Not quite! The frogs missed the lilypads. Check the hint!');
      }
    }, 600);
  };

  const handleNextLevel = () => {
    setIsJumping(false);
    setLevelPassed(false);
    setShowHint(false);
    setErrorMsg('');

    if (currentLevelIdx + 1 < levels.length) {
      setCurrentLevelIdx((prev) => prev + 1);
    } else {
      // Game Won!
      setGameWon(true);
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
      });
      onComplete(1.0);
    }
  };

  const handleRestart = () => {
    setCurrentLevelIdx(0);
    setIsJumping(false);
    setLevelPassed(false);
    setShowHint(false);
    setErrorMsg('');
    setGameWon(false);
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      {/* HUD Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px 16px 0 0',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderBottom: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}>🐸</span>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Python Froggy (PyFroggy)</h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Inspired by Flexbox Froggy • Master Python Lists & Slices
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            Level {currentLevelIdx + 1} of {levels.length}
          </div>

          <button
            onClick={handleRestart}
            title="Restart Froggy"
            style={{
              background: 'var(--bg-muted)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '6px 10px',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Pond & Code Stage */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 1.2fr) minmax(280px, 1fr)',
          borderRadius: '0 0 16px 16px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Left: The Visual Pond Area */}
        <div
          style={{
            position: 'relative',
            minHeight: '380px',
            background: 'radial-gradient(ellipse at center, #0284c7 0%, #0369a1 60%, #0c4a6e 100%)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Water Ripples Pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage:
                'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.12) 0%, transparent 40%), radial-gradient(circle at 75% 70%, rgba(255, 255, 255, 0.08) 0%, transparent 45%)',
              pointerEvents: 'none',
            }}
          />

          {/* Floating Lilypads (Targets) */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              justifyContent:
                currentLevel.lilypads[0].align === 'end'
                  ? 'flex-end'
                  : currentLevel.lilypads[0].align === 'between'
                  ? 'space-between'
                  : currentLevel.lilypads[0].align === 'center'
                  ? 'center'
                  : 'flex-start',
              gap: '20px',
              zIndex: 1,
            }}
          >
            {currentLevel.lilypads.map((lp, idx) => {
              const padColor = lp.color === 'yellow' ? '#f59e0b' : lp.color === 'red' ? '#ef4444' : '#10b981';
              return (
                <div
                  key={idx}
                  style={{
                    position: 'relative',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle at 35% 35%, ${padColor} 0%, #064e3b 100%)`,
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 8px 18px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '1.2rem', opacity: 0.85 }}>🪷</span>
                </div>
              );
            })}
          </div>

          {/* Animated Frogs (Actors) */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              justifyContent: isJumping
                ? currentLevel.lilypads[0].align === 'end'
                  ? 'flex-end'
                  : currentLevel.lilypads[0].align === 'between'
                  ? 'space-between'
                  : currentLevel.lilypads[0].align === 'center'
                  ? 'center'
                  : 'flex-start'
                : 'flex-start',
              gap: '24px',
              zIndex: 2,
              transition: 'all 0.65s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {currentLevel.frogs.map((frog) => {
              const frogBg = frog.color === 'yellow' ? '#eab308' : frog.color === 'red' ? '#dc2626' : '#16a34a';
              return (
                <div
                  key={frog.id}
                  style={{
                    position: 'relative',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50% 50% 45% 45%',
                    background: `radial-gradient(circle at 35% 30%, #a7f3d0 0%, ${frogBg} 70%)`,
                    boxShadow: isJumping ? '0 24px 28px rgba(0, 0, 0, 0.4)' : '0 8px 16px rgba(0, 0, 0, 0.3)',
                    transform: isJumping ? 'translateY(-35px) scale(1.15)' : 'translateY(0) scale(1)',
                    transition: 'transform 0.45s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Cute Frog Eyes */}
                  <div style={{ display: 'flex', gap: '14px', position: 'absolute', top: '-6px' }}>
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }}
                    >
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#000' }} />
                    </div>
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }}
                    >
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#000' }} />
                    </div>
                  </div>

                  {/* Frog Smile */}
                  <div
                    style={{
                      width: '16px',
                      height: '6px',
                      borderBottom: '2px solid rgba(0, 0, 0, 0.6)',
                      borderRadius: '0 0 10px 10px',
                      marginTop: '12px',
                    }}
                  />
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                    {frog.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Pond Bottom Logs / Decor */}
          <div style={{ display: 'flex', justifyContent: 'space-between', zIndex: 1, opacity: 0.6 }}>
            <span style={{ fontSize: '1.2rem' }}>🌿</span>
            <span style={{ fontSize: '1.2rem' }}>🌸</span>
            <span style={{ fontSize: '1.2rem' }}>🌿</span>
          </div>
        </div>

        {/* Right: Code & Instruction Area */}
        <div
          style={{
            background: 'var(--bg-surface)',
            padding: '24px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{currentLevel.title}</h3>
              <button
                onClick={() => setShowHint(!showHint)}
                title="Toggle Hint"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-accent-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                <HelpCircle size={15} />
                <span>Hint</span>
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '16px' }}>
              {currentLevel.instructions}
            </p>

            {showHint && (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: 'var(--color-accent-gold)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  marginBottom: '16px',
                }}
              >
                💡 {currentLevel.hint}
              </div>
            )}

            {errorMsg && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  marginBottom: '16px',
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Python Code Command Box */}
            <div
              style={{
                background: '#0b0f19',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '14px 16px',
                marginBottom: '18px',
                fontFamily: 'var(--font-code)',
                fontSize: '0.9rem',
              }}
            >
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '6px' }}>
                # Python Leap Command:
              </div>
              <div style={{ color: 'var(--color-primary)' }}>
                {currentLevel.defaultCode}
              </div>
            </div>

            {/* Selectable Code Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                SELECT PYTHON COMMAND:
              </span>
              {currentLevel.options.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  disabled={levelPassed}
                  onClick={() => handleSelectOption(opt)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-muted)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.86rem',
                    fontFamily: 'var(--font-code)',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: levelPassed ? 'default' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!levelPassed) e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onMouseLeave={(e) => {
                    if (!levelPassed) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div>
            {levelPassed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--color-accent-green)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                  }}
                >
                  <CheckCircle size={18} />
                  <span>Frogs reached the lilypads!</span>
                </div>

                <button
                  onClick={handleNextLevel}
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
                >
                  <span>
                    {currentLevelIdx + 1 < levels.length ? 'Next Lilypad Level' : 'Claim Froggy Victory!'}
                  </span>
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Victory Celebration */}
      {gameWon && (
        <div
          style={{
            marginTop: '20px',
            padding: '24px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎉</div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-accent-green)', marginBottom: '6px' }}>
            All Frogs Safely On Lilypads!
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '14px' }}>
            You mastered Python lists, slicing, and conditionals across all levels.
          </p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-accent-gold)',
              fontWeight: 700,
              fontSize: '1rem',
            }}
          >
            <Trophy size={18} />
            <span>+50 XP Awarded</span>
          </div>
        </div>
      )}
    </div>
  );
}

