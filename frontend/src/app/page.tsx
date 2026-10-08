'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Terminal, Swords, Brain, Compass, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="container">
      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '60px 0 80px',
        maxWidth: '860px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: 'var(--color-primary)',
          padding: '6px 16px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '24px'
        }}>
          <Sparkles size={16} />
          <span>The Gamified Mastery Platform for Python</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-1px',
          marginBottom: '20px'
        }}>
          Learn Python by <span style={{
            background: 'linear-gradient(135deg, #6366f1, #10b981, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Playing, Coding & Conquering</span>
        </h1>

        <p style={{
          fontSize: '1.2rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: '36px',
          maxWidth: '680px',
          margin: '0 auto 36px'
        }}>
          Transform abstract Python concepts into interactive missions. Advance from Rookie to Code Master as you solve coding challenges, defeat world bosses, and earn badges.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href={user ? '/dashboard' : '/register'}
            className="btn-primary"
            style={{ padding: '14px 32px', fontSize: '1.05rem' }}
          >
            <span>{user ? 'Enter Your Dashboard' : 'Start Your Adventure Free'}</span>
            <ArrowRight size={18} />
          </Link>

          <Link
            href="/worlds"
            className="btn-secondary"
            style={{ padding: '14px 28px', fontSize: '1.05rem' }}
          >
            <Compass size={18} />
            <span>Explore World Map</span>
          </Link>
        </div>
      </section>

      {/* The Mastery Loop */}
      <section style={{ marginBottom: '80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '10px' }}>
            The 7-Step Mastery Loop
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Every topic is carefully crafted to guarantee real conceptual and practical mastery.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          {[
            { step: '1', title: 'Learn', icon: '📚', desc: 'Concept explanation' },
            { step: '2', title: 'Examples', icon: '💡', desc: 'Syntax & diagrams' },
            { step: '3', title: 'Practice', icon: '✍️', desc: 'Mini-checks' },
            { step: '4', title: 'Game', icon: '🎮', desc: 'Interactive arena' },
            { step: '5', title: 'Code', icon: '💻', desc: 'Live Python sandbox' },
            { step: '6', title: 'Assess', icon: '🧠', desc: 'Adaptive evaluation' },
            { step: '7', title: 'Master', icon: '🔓', desc: 'Unlock next world' },
          ].map((item) => (
            <div
              key={item.step}
              className="glass-panel"
              style={{
                padding: '20px 14px',
                textAlign: 'center',
                transition: 'transform var(--transition-fast)'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{item.icon}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                Step {item.step}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '4px 0' }}>{item.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section style={{ marginBottom: '80px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
              marginBottom: '20px'
            }}>
              <Terminal size={24} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '10px' }}>
              In-Browser Monaco Code Sandbox
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Full VS Code editing experience with instant isolated execution, automated test cases, and immediate console feedback.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-accent-green)',
              marginBottom: '20px'
            }}>
              <Brain size={24} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '10px' }}>
              Socratic AI Learning Assistant
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Progressive hints that guide your thinking step-by-step rather than spoiling the solution. Understand the why behind every bug.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(236, 72, 153, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-accent-pink)',
              marginBottom: '20px'
            }}>
              <Swords size={24} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '10px' }}>
              Grand Boss Battles
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Synthesize variables, operators, conditions, loops, collections, and functions in multi-stage boss showdowns to unlock new realms!
            </p>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="glass-panel" style={{
        padding: '50px 30px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(16, 185, 129, 0.08))',
        border: '1px solid rgba(99, 102, 241, 0.25)'
      }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '14px' }}>
          Ready to Begin Your Python Journey?
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 28px' }}>
          Join Code2Learn today and level up your programming prowess with interactive worlds and live sandbox challenges.
        </p>
        <Link href={user ? '/worlds' : '/register'} className="btn-primary" style={{ padding: '14px 36px', fontSize: '1rem' }}>
          <span>{user ? 'Jump to World Map' : 'Create Free Account'}</span>
          <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  );
}
