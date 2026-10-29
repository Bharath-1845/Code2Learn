'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, RefreshCw, Trophy, Zap, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RedBallGameProps {
  topicId: string;
  onComplete: (score: number) => void;
}

export default function RedBallGame({ topicId, onComplete }: RedBallGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game state
  const [starsCollected, setStarsCollected] = useState(0);
  const [totalStars, setTotalStars] = useState(4);
  const [gateUnlocked, setGateUnlocked] = useState(false);
  const [showGatePrompt, setShowGatePrompt] = useState(false);
  const [gateAnswered, setGateAnswered] = useState(false);
  const [selectedGateOption, setSelectedGateOption] = useState<string | null>(null);
  const [gateError, setGateError] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [lives, setLives] = useState(3);

  // Gate Python Question based on topic
  const getGateChallenge = () => {
    if (topicId.includes('intro') || topicId.includes('foundations')) {
      return {
        prompt: 'Python Terminal: Select the valid command to output text to screen:',
        options: ['print("Hello!")', 'echo "Hello!"', 'console.log("Hello!")', 'System.out("Hello!")'],
        correct: 'print("Hello!")',
      };
    }
    if (topicId.includes('variables') || topicId.includes('types')) {
      return {
        prompt: 'Python Terminal: What is the data type of value `42.0`?',
        options: ['float', 'int', 'str', 'double'],
        correct: 'float',
      };
    }
    if (topicId.includes('operators')) {
      return {
        prompt: 'Python Terminal: Which operator computes remainder in Python?',
        options: ['%', '//', '**', '&'],
        correct: '%',
      };
    }
    if (topicId.includes('conditions')) {
      return {
        prompt: 'Python Terminal: What does `5 > 3 and 2 < 1` evaluate to?',
        options: ['False', 'True', 'None', 'Error'],
        correct: 'False',
      };
    }
    if (topicId.includes('loops')) {
      return {
        prompt: 'Python Terminal: How many times does `for i in range(3):` iterate?',
        options: ['3', '4', '2', 'Infinite'],
        correct: '3',
      };
    }
    if (topicId.includes('collections')) {
      return {
        prompt: 'Python Terminal: What does `[10, 20, 30][1]` return?',
        options: ['20', '10', '30', 'IndexError'],
        correct: '20',
      };
    }
    if (topicId.includes('functions')) {
      return {
        prompt: 'Python Terminal: Which keyword defines a function in Python?',
        options: ['def', 'func', 'function', 'define'],
        correct: 'def',
      };
    }
    return {
      prompt: 'Python Terminal: What is the boolean literal for truth in Python?',
      options: ['True', 'true', 'TRUE', '1'],
      correct: 'True',
    };
  };

  const gateChallenge = getGateChallenge();

  // References for game loop
  const gameStateRef = useRef({
    ball: {
      x: 50,
      y: 280,
      radius: 16,
      vx: 0,
      vy: 0,
      rotation: 0,
      isGrounded: false,
    },
    keys: {
      left: false,
      right: false,
      up: false,
    },
    stars: [
      { x: 180, y: 220, collected: false },
      { x: 310, y: 160, collected: false },
      { x: 500, y: 210, collected: false },
      { x: 670, y: 190, collected: false },
    ],
    gate: {
      x: 440,
      y: 170,
      width: 14,
      height: 140,
      unlocked: false,
    },
    terminal: {
      x: 390,
      y: 275,
      width: 24,
      height: 35,
    },
    platforms: [
      { x: 0, y: 310, width: 220, height: 90 }, // Ground 1
      { x: 260, y: 240, width: 110, height: 20 }, // Floating platform 1
      { x: 370, y: 310, width: 220, height: 90 }, // Ground 2 (terminal & gate)
      { x: 480, y: 250, width: 90, height: 20 },  // Floating platform 2
      { x: 620, y: 310, width: 240, height: 90 }, // Goal ground
    ],
    spikes: [
      { x: 222, y: 310, width: 36, height: 18 },
      { x: 592, y: 310, width: 26, height: 18 },
    ],
    flag: {
      x: 750,
      y: 235,
      width: 30,
      height: 75,
    },
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>,
    cameraX: 0,
    gateUnlocked: false,
    gameOver: false,
  });

  // Handle gate interaction
  const handleSolveGate = (option: string) => {
    setSelectedGateOption(option);
    if (option === gateChallenge.correct) {
      setGateAnswered(true);
      setGateUnlocked(true);
      setGateError(false);
      gameStateRef.current.gateUnlocked = true;

      // Create burst particles
      for (let i = 0; i < 25; i++) {
        gameStateRef.current.particles.push({
          x: gameStateRef.current.gate.x,
          y: gameStateRef.current.gate.y + Math.random() * gameStateRef.current.gate.height,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          color: '#10b981',
          life: 40,
        });
      }

      setTimeout(() => {
        setShowGatePrompt(false);
      }, 1000);
    } else {
      setGateError(true);
    }
  };

  const restartGame = () => {
    const s = gameStateRef.current;
    s.ball.x = 50;
    s.ball.y = 280;
    s.ball.vx = 0;
    s.ball.vy = 0;
    s.ball.rotation = 0;
    s.ball.isGrounded = false;
    s.stars.forEach((st) => (st.collected = false));
    s.gateUnlocked = false;
    s.gameOver = false;
    setStarsCollected(0);
    setGateUnlocked(false);
    setGateAnswered(false);
    setSelectedGateOption(null);
    setShowGatePrompt(false);
    setGameWon(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleKeyDown = (e: KeyboardEvent) => {
      const keys = gameStateRef.current.keys;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = true;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        keys.up = true;
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = gameStateRef.current.keys;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') keys.up = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Main Physics & Render Loop
    const loop = () => {
      const state = gameStateRef.current;
      const b = state.ball;
      const keys = state.keys;

      // 1. Controls & Acceleration
      const accel = 0.55;
      const friction = 0.86;
      const maxSpeed = 5.5;
      const gravity = 0.52;
      const jumpStrength = -11.5;

      if (keys.left) {
        b.vx -= accel;
        b.rotation -= 0.12;
      }
      if (keys.right) {
        b.vx += accel;
        b.rotation += 0.12;
      }

      // Clamp speed & apply friction
      b.vx *= friction;
      if (Math.abs(b.vx) > maxSpeed) b.vx = Math.sign(b.vx) * maxSpeed;

      // Jump
      if (keys.up && b.isGrounded) {
        b.vy = jumpStrength;
        b.isGrounded = false;
        // Jump dust particles
        for (let i = 0; i < 6; i++) {
          state.particles.push({
            x: b.x,
            y: b.y + b.radius,
            vx: (Math.random() - 0.5) * 3,
            vy: Math.random() * -2,
            color: '#e2e8f0',
            life: 20,
          });
        }
      }

      // Apply Gravity
      b.vy += gravity;
      if (b.vy > 12) b.vy = 12;

      // Predict next position
      b.x += b.vx;
      b.y += b.vy;

      // World boundaries
      if (b.x - b.radius < 0) {
        b.x = b.radius;
        b.vx = 0;
      }
      if (b.x + b.radius > 820) {
        b.x = 820 - b.radius;
        b.vx = 0;
      }

      // 2. Collision with Platforms
      b.isGrounded = false;
      for (const p of state.platforms) {
        // Horizontal check
        if (b.x + b.radius * 0.7 > p.x && b.x - b.radius * 0.7 < p.x + p.width) {
          // Landing on top
          if (b.y + b.radius >= p.y && b.y - b.radius < p.y && b.vy >= 0) {
            b.y = p.y - b.radius;
            b.vy = 0;
            b.isGrounded = true;
          }
          // Hitting ceiling
          else if (b.y - b.radius <= p.y + p.height && b.y + b.radius > p.y + p.height && b.vy < 0) {
            b.y = p.y + p.height + b.radius;
            b.vy = 0;
          }
        }
      }

      // 3. Collision with Laser Gate (if locked)
      if (!state.gateUnlocked) {
        const g = state.gate;
        if (
          b.x + b.radius > g.x &&
          b.x - b.radius < g.x + g.width &&
          b.y + b.radius > g.y &&
          b.y - b.radius < g.y + g.height
        ) {
          b.x = g.x - b.radius - 2;
          b.vx = -1.5;
          setShowGatePrompt(true);
        }
      }

      // Check proximity to Terminal
      const term = state.terminal;
      const distToTerminal = Math.hypot(b.x - (term.x + term.width / 2), b.y - (term.y + term.height / 2));
      if (distToTerminal < 45 && !state.gateUnlocked) {
        setShowGatePrompt(true);
      }

      // 4. Collision with Spikes
      for (const sp of state.spikes) {
        if (
          b.x + b.radius > sp.x &&
          b.x - b.radius < sp.x + sp.width &&
          b.y + b.radius > sp.y &&
          b.y - b.radius < sp.y + sp.height
        ) {
          // Hurt / Respawn
          b.x = 50;
          b.y = 280;
          b.vx = 0;
          b.vy = 0;
          setLives((l) => Math.max(0, l - 1));
          for (let i = 0; i < 20; i++) {
            state.particles.push({
              x: sp.x + 10,
              y: sp.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              color: '#ef4444',
              life: 30,
            });
          }
        }
      }

      // Pit fall check
      if (b.y > 400) {
        b.x = 50;
        b.y = 280;
        b.vx = 0;
        b.vy = 0;
        setLives((l) => Math.max(0, l - 1));
      }

      // 5. Star Collection
      let collectedNow = 0;
      state.stars.forEach((st) => {
        if (!st.collected) {
          const dist = Math.hypot(b.x - st.x, b.y - st.y);
          if (dist < b.radius + 14) {
            st.collected = true;
            // Sparkle burst
            for (let i = 0; i < 15; i++) {
              state.particles.push({
                x: st.x,
                y: st.y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                color: '#f59e0b',
                life: 25,
              });
            }
          }
        }
        if (st.collected) collectedNow++;
      });
      setStarsCollected(collectedNow);

      // 6. Finish Flag Check
      const fl = state.flag;
      if (b.x + b.radius > fl.x && b.y + b.radius > fl.y && b.x - b.radius < fl.x + fl.width + 40 && !state.gameOver) {
        state.gameOver = true;
        setGameWon(true);
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
        const finalScore = Math.max(0.6, (collectedNow / state.stars.length) * 0.4 + (state.gateUnlocked ? 0.6 : 0.3));
        onComplete(finalScore);
      }

      // 7. Update Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        if (p.life <= 0) {
          state.particles.splice(i, 1);
        }
      }

      // ==========================================
      // RENDERING
      // ==========================================
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Starry sky dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      const dots = [
        [40, 50], [120, 80], [210, 40], [330, 90], [450, 45],
        [560, 75], [680, 35], [780, 80], [280, 110], [620, 120]
      ];
      dots.forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(dx, dy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Distant mountains
      ctx.fillStyle = 'rgba(49, 46, 129, 0.35)';
      ctx.beginPath();
      ctx.moveTo(0, 310);
      ctx.lineTo(120, 190);
      ctx.lineTo(260, 310);
      ctx.lineTo(400, 170);
      ctx.lineTo(550, 310);
      ctx.lineTo(680, 180);
      ctx.lineTo(820, 310);
      ctx.fill();

      // Render Platforms
      for (const p of state.platforms) {
        // Platform top grass highlight
        ctx.fillStyle = '#10b981';
        ctx.fillRect(p.x, p.y, p.width, 5);

        // Platform stone body
        const platGrad = ctx.createLinearGradient(0, p.y, 0, p.y + p.height);
        platGrad.addColorStop(0, '#1e293b');
        platGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = platGrad;
        ctx.fillRect(p.x, p.y + 5, p.width, p.height - 5);

        // Platform border hairline
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
        ctx.strokeRect(p.x, p.y, p.width, p.height);
      }

      // Render Spikes
      for (const sp of state.spikes) {
        ctx.fillStyle = '#ef4444';
        const spikeCount = 3;
        const wStep = sp.width / spikeCount;
        for (let sIdx = 0; sIdx < spikeCount; sIdx++) {
          ctx.beginPath();
          ctx.moveTo(sp.x + sIdx * wStep, sp.y + sp.height);
          ctx.lineTo(sp.x + sIdx * wStep + wStep / 2, sp.y);
          ctx.lineTo(sp.x + (sIdx + 1) * wStep, sp.y + sp.height);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Render Python Terminal Station
      const termObj = state.terminal;
      ctx.fillStyle = state.gateUnlocked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)';
      ctx.strokeStyle = state.gateUnlocked ? '#10b981' : '#6366f1';
      ctx.lineWidth = 2;
      ctx.fillRect(termObj.x, termObj.y, termObj.width, termObj.height);
      ctx.strokeRect(termObj.x, termObj.y, termObj.width, termObj.height);

      // Terminal screen glow
      ctx.fillStyle = state.gateUnlocked ? '#10b981' : '#818cf8';
      ctx.fillRect(termObj.x + 4, termObj.y + 4, termObj.width - 8, 14);
      ctx.font = '10px monospace';
      ctx.fillStyle = '#0f172a';
      ctx.fillText('PY', termObj.x + 5, termObj.y + 15);

      // Render Laser Gate
      if (!state.gateUnlocked) {
        const g = state.gate;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 14;
        ctx.fillRect(g.x, g.y, g.width, g.height);

        // Warning bands
        ctx.fillStyle = '#fef08a';
        for (let yb = g.y + 10; yb < g.y + g.height - 10; yb += 24) {
          ctx.fillRect(g.x + 1, yb, g.width - 2, 8);
        }
        ctx.shadowBlur = 0; // reset
      }

      // Render Stars
      state.stars.forEach((st) => {
        if (!st.collected) {
          ctx.save();
          ctx.translate(st.x, st.y);
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 12;
          ctx.fillStyle = '#f59e0b';

          // Star shape
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos(((18 + i * 72) * Math.PI) / 180) * 10, -Math.sin(((18 + i * 72) * Math.PI) / 180) * 10);
            ctx.lineTo(Math.cos(((54 + i * 72) * Math.PI) / 180) * 4, -Math.sin(((54 + i * 72) * Math.PI) / 180) * 4);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      });

      // Render Flag
      const flg = state.flag;
      // Flagpole
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(flg.x, flg.y, 4, flg.height);
      // Flag banner
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(flg.x + 4, flg.y);
      ctx.lineTo(flg.x + 32, flg.y + 15);
      ctx.lineTo(flg.x + 4, flg.y + 30);
      ctx.closePath();
      ctx.fill();

      // Render Particles
      for (const pt of state.particles) {
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render Red Ball
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rotation);

      // Red Sphere 3D gradient
      const ballGrad = ctx.createRadialGradient(-4, -5, 2, 0, 0, b.radius);
      ballGrad.addColorStop(0, '#f87171');
      ballGrad.addColorStop(0.5, '#ef4444');
      ballGrad.addColorStop(1, '#991b1b');

      ctx.fillStyle = ballGrad;
      ctx.shadowColor = 'rgba(239, 68, 68, 0.45)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Ball Eyes (animated face)
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(4, -3, 3.5, 0, Math.PI * 2); // Right eye
      ctx.arc(-2, -3, 3.5, 0, Math.PI * 2); // Left eye
      ctx.fill();

      // Eye pupils looking towards velocity
      const lookOffset = Math.sign(b.vx || 1) * 1.5;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(4 + lookOffset, -3, 1.8, 0, Math.PI * 2);
      ctx.arc(-2 + lookOffset, -3, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Cute Smile
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(1, 2, 4, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animId);
    };
  }, [topicId, onComplete]);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '820px', margin: '0 auto' }}>
      {/* HUD Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px 16px 0 0',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderBottom: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.2rem' }}>🔴</span>
            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Red Ball: Python Runner</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '0.82rem',
              fontWeight: 700,
            }}
          >
            <Sparkles size={14} />
            <span>
              Stars: {starsCollected} / {totalStars}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: gateUnlocked ? '#10b981' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {gateUnlocked ? <CheckCircle2 size={14} /> : <Zap size={14} />}
            {gateUnlocked ? 'Gate Deactivated' : 'Gate Locked'}
          </span>

          <button
            onClick={restartGame}
            title="Restart Level"
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
            <RefreshCw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div
        style={{
          position: 'relative',
          borderRadius: '0 0 16px 16px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        <canvas
          ref={canvasRef}
          width={820}
          height={380}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            background: '#0b0f19',
          }}
        />

        {/* Python Gate Question Modal Overlay */}
        {showGatePrompt && !gateUnlocked && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(11, 15, 25, 0.88)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 10,
            }}
          >
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: '16px',
                padding: '24px 28px',
                maxWidth: '520px',
                width: '100%',
                boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <Zap size={24} />
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
                Python Terminal Gate Locked!
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '18px' }}>
                {gateChallenge.prompt}
              </p>

              {gateError && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    marginBottom: '14px',
                  }}
                >
                  Incorrect code syntax. Try again to disarm the barrier!
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {gateChallenge.options.map((opt, oIdx) => (
                  <button
                    key={oIdx}
                    onClick={() => handleSolveGate(opt)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background:
                        selectedGateOption === opt
                          ? opt === gateChallenge.correct
                            ? 'rgba(16, 185, 129, 0.25)'
                            : 'rgba(239, 68, 68, 0.25)'
                          : 'var(--bg-muted)',
                      border: `1px solid ${
                        selectedGateOption === opt
                          ? opt === gateChallenge.correct
                            ? '#10b981'
                            : '#ef4444'
                          : 'var(--border-subtle)'
                      }`,
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-code)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: '16px' }}>
                <button
                  onClick={() => setShowGatePrompt(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Close & Retreat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Victory Celebration Overlay */}
        {gameWon && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(11, 15, 25, 0.92)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              zIndex: 20,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: '10px' }}>🏁</div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>
              Level Cleared! Red Ball Reached the Goal!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '420px', marginBottom: '20px' }}>
              You navigated the platforms, disarmed the Python laser barrier, and collected {starsCollected} of{' '}
              {totalStars} stars!
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                padding: '8px 20px',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '1rem',
                marginBottom: '24px',
              }}
            >
              <Trophy size={18} />
              <span>Challenge Conquered (+50 XP)</span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={restartGame} className="btn-secondary" style={{ padding: '10px 20px' }}>
                <RefreshCw size={15} />
                <span>Play Again</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Touch & On-Screen Controls Footer */}
      <div
        style={{
          marginTop: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 18px',
          background: 'var(--bg-muted)',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          ⌨️ Controls: Use <kbd style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px' }}>◀</kbd>{' '}
          <kbd style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px' }}>▶</kbd> or{' '}
          <kbd style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px' }}>A</kbd>{' '}
          <kbd style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px' }}>D</kbd> to roll, and{' '}
          <kbd style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px' }}>Space</kbd> /{' '}
          <kbd style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px' }}>▲</kbd> to Jump!
        </div>

        {/* Clickable Mobile/Mouse Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onMouseDown={() => (gameStateRef.current.keys.left = true)}
            onMouseUp={() => (gameStateRef.current.keys.left = false)}
            onTouchStart={() => (gameStateRef.current.keys.left = true)}
            onTouchEnd={() => (gameStateRef.current.keys.left = false)}
            style={{
              padding: '8px 16px',
              background: '#1e293b',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ◀ Left
          </button>
          <button
            onMouseDown={() => (gameStateRef.current.keys.up = true)}
            onMouseUp={() => (gameStateRef.current.keys.up = false)}
            onTouchStart={() => (gameStateRef.current.keys.up = true)}
            onTouchEnd={() => (gameStateRef.current.keys.up = false)}
            style={{
              padding: '8px 18px',
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ▲ Jump
          </button>
          <button
            onMouseDown={() => (gameStateRef.current.keys.right = true)}
            onMouseUp={() => (gameStateRef.current.keys.right = false)}
            onTouchStart={() => (gameStateRef.current.keys.right = true)}
            onTouchEnd={() => (gameStateRef.current.keys.right = false)}
            style={{
              padding: '8px 16px',
              background: '#1e293b',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Right ▶
          </button>
        </div>
      </div>
    </div>
  );
}

