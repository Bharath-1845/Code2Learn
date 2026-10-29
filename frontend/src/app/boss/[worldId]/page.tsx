'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { challengeApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import confetti from 'canvas-confetti';
import { Swords, Shield, Heart, Zap, Play, CheckCircle2, ArrowRight } from 'lucide-react';

export default function BossBattlePage() {
  const params = useParams();
  const router = useRouter();
  const worldId = params.worldId as string;
  const { addXp } = useAuth();

  const [boss, setBoss] = useState<any>(null);
  const [currentStage, setCurrentStage] = useState(0);
  const [stageCode, setStageCode] = useState('');
  const [stageOutput, setStageOutput] = useState('');
  const [bossHp, setBossHp] = useState(100);
  const [victory, setVictory] = useState(false);
  const [running, setRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBoss();
  }, [worldId]);

  const loadBoss = async () => {
    try {
      const b = await challengeApi.getBossBattle(worldId);
      setBoss(b);
      setStageCode(getDefaultCodeForStage(0));
    } catch (err) {
      console.error('Failed to load boss:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultCodeForStage = (stageIdx: number) => {
    if (stageIdx === 0) {
      return `base_dmg = 50\ncrit_rate = 1.5\ndefense = 15\n# Calculate final_dmg and print\nfinal_dmg = int((base_dmg * crit_rate) - defense)\nprint(final_dmg)\n`;
    }
    if (stageIdx === 1) {
      return `minions = [25, 40, 60]\n# Subtract 20 from each minion and print the sum\n\n`;
    }
    return `def victory_shout(hero, score):\n    return f"{hero} conquered the arena with {score} XP!"\n\nprint(victory_shout("Master", 250))\n`;
  };

  const handleExecuteStage = async () => {
    setRunning(true);
    setErrorMsg('');
    try {
      const runRes = await challengeApi.runCode(stageCode);
      setStageOutput(runRes.stdout || runRes.stderr);

      const stage = boss.stages[currentStage];
      const actual = runRes.stdout.trim();
      const expected = stage.expected_output.trim();

      if (actual === expected && !runRes.stderr) {
        // Stage defeated!
        const nextStage = currentStage + 1;
        const newHp = Math.max(0, 100 - Math.round(((nextStage) / boss.stages.length) * 100));
        setBossHp(newHp);

        if (nextStage < boss.stages.length) {
          setCurrentStage(nextStage);
          setStageCode(getDefaultCodeForStage(nextStage));
          setStageOutput(`Stage ${currentStage + 1} Cleared! Boss HP dropped.`);
        } else {
          // Boss Defeated!
          setVictory(true);
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.5 }
          });
          const res = await challengeApi.submitBossBattle(boss.id, true);
          if (res?.xp_earned && res.xp_earned > 0) {
            addXp(res.xp_earned, res.new_level);
          }
        }
      } else {
        setErrorMsg(`Expected '${expected}', but got '${actual}'. Try tweaking your code!`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Execution failed.');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <div style={{ fontSize: '3rem', animation: 'pulseGlow 1.2s infinite' }}>🐉</div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Summoning Beginner Boss...</p>
      </div>
    );
  }

  if (!boss) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <p>Boss battle not found.</p>
        <Link href="/worlds" className="btn-primary" style={{ marginTop: '20px' }}>
          Back to Worlds
        </Link>
      </div>
    );
  }

  const stage = boss.stages[currentStage] || {};

  return (
    <div className="container" style={{ maxWidth: '960px' }}>
      {/* Boss Header Banner */}
      <div className="glass-panel" style={{
        padding: '32px',
        marginBottom: '28px',
        border: '2px solid rgba(236, 72, 153, 0.4)',
        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(99, 102, 241, 0.15))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              fontSize: '3.5rem',
              width: '84px',
              height: '84px',
              borderRadius: '24px',
              background: 'rgba(236, 72, 153, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(236, 72, 153, 0.4)'
            }}>
              {boss.boss_avatar || '🐉'}
            </div>

            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ec4899', textTransform: 'uppercase' }}>
                FINAL BOSS OF BEGINNER REALM
              </div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{boss.boss_name}</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '520px' }}>
                {boss.storyline}
              </p>
            </div>
          </div>

          {/* Boss HP Bar */}
          <div style={{ minWidth: '220px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
              <span style={{ color: '#ec4899', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Heart size={16} fill="#ec4899" /> BOSS HP
              </span>
              <span>{bossHp}%</span>
            </div>
            <div style={{
              width: '100%',
              height: '12px',
              background: 'var(--bg-muted)',
              borderRadius: '999px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${bossHp}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #ef4444, #ec4899)',
                borderRadius: '999px',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Stage Arena */}
      {!victory ? (
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              STAGE {currentStage + 1} OF {boss.stages.length}: {stage.title}
            </span>
            <span className="badge badge-xp">+{boss.xp_reward} XP on Victory</span>
          </div>

          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px' }}>
            {stage.prompt}
          </h2>

          {/* Code Editor Area */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Python Solution Script:
            </label>
            <textarea
              rows={8}
              value={stageCode}
              onChange={(e) => setStageCode(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                color: 'var(--text-main)',
                fontSize: '0.95rem',
                fontFamily: 'var(--font-code)',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <button
              onClick={handleExecuteStage}
              disabled={running}
              className="btn-primary"
              style={{
                background: 'linear-gradient(135deg, #ec4899, #6366f1)',
                padding: '12px 28px',
                fontSize: '1rem'
              }}
            >
              <Swords size={18} />
              <span>{running ? 'Casting Strike...' : 'Cast Python Strike!'}</span>
            </button>

            {errorMsg && (
              <div style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: 600 }}>
                {errorMsg}
              </div>
            )}
          </div>

          {/* Output Preview */}
          {stageOutput && (
            <div style={{ marginTop: '20px', background: 'var(--bg-muted)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Battle Output:</div>
              <pre style={{ fontFamily: 'var(--font-code)', fontSize: '0.9rem' }}>{stageOutput}</pre>
            </div>
          )}
        </div>
      ) : (
        /* Victory Screen */
        <div className="glass-panel" style={{ padding: '60px 30px', textAlign: 'center' }}>
          <div style={{ fontSize: '4.5rem', marginBottom: '16px' }}>🏆</div>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '10px' }}>
            VICTORY! Pythos Has Fallen!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 28px' }}>
            You have successfully conquered all 7 Beginner Worlds and proven your ability to synthesize variables, loops, collections, and functions.
          </p>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#f59e0b',
            padding: '12px 28px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 800,
            fontSize: '1.2rem',
            marginBottom: '36px'
          }}>
            <Zap size={24} />
            <span>+250 XP Awarded & Intermediate Realm Unlocked!</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <Link href="/dashboard" className="btn-primary" style={{ padding: '14px 32px' }}>
              <span>Return to Dashboard</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
