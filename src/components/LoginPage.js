'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ArrowRight, User, Lock, Mail, Loader2, Sparkles, Shield, Heart } from 'lucide-react';
import CatIcon from './CatIcon';

export default function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const containerRef = useRef(null);
  const overlayRef = useRef(null);
  const titleRef = useRef(null);
  const spotlightRef = useRef({ x: 50, y: 50 });

  // Mouse spotlight tracking
  const handleMouseMove = useCallback((e) => {
    if (!titleRef.current) return;
    const rect = titleRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    spotlightRef.current = { x, y };
    titleRef.current.style.setProperty('--spotlight-x', `${x}%`);
    titleRef.current.style.setProperty('--spotlight-y', `${y}%`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!titleRef.current) return;
    // Smoothly fade out the spotlight
    titleRef.current.style.setProperty('--spotlight-opacity', '0');
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!titleRef.current) return;
    titleRef.current.style.setProperty('--spotlight-opacity', '1');
  }, []);

  useGSAP(() => {
    // Title entrance
    gsap.from('.auth-hero-title', {
      y: -30,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      clearProps: 'opacity,transform'
    });
    gsap.from('.auth-hero-subtitle', {
      y: -15,
      opacity: 0,
      duration: 0.8,
      delay: 0.3,
      ease: 'power3.out',
      clearProps: 'opacity,transform'
    });
    gsap.from('.auth-container', {
      scale: 0.95,
      opacity: 0,
      duration: 0.8,
      delay: 0.2,
      ease: 'power3.out',
      clearProps: 'all'
    });
    gsap.from('.auth-overlay-content', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      delay: 0.5,
      ease: 'power3.out',
      clearProps: 'all'
    });
    gsap.from('.auth-form-content', {
      y: 20,
      opacity: 0,
      stagger: 0.08,
      duration: 0.6,
      delay: 0.6,
      ease: 'power2.out',
      clearProps: 'all'
    });
  }, { scope: containerRef });

  // Animate panel transition
  useEffect(() => {
    if (!overlayRef.current) return;
    
    const tl = gsap.timeline({ defaults: { duration: 0.6, ease: 'power2.inOut' } });
    
    // Animate overlay content
    tl.fromTo('.auth-overlay-content', 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, clearProps: 'all' },
      0.2
    );

    // Animate form fields
    tl.fromTo('.auth-form-field',
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, stagger: 0.06, clearProps: 'all' },
      0.3
    );
  }, [isRegister]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister ? { name, email, password } : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro na autenticação');
      }

      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (register) => {
    setIsRegister(register);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="auth-page" ref={containerRef}>
      {/* Floating particles background */}
      <div className="auth-bg-particles">
        <div className="auth-particle auth-particle-1" />
        <div className="auth-particle auth-particle-2" />
        <div className="auth-particle auth-particle-3" />
        <div className="auth-particle auth-particle-4" />
        <div className="auth-particle auth-particle-5" />
      </div>

      {/* ═══ HERO TITLE WITH SPOTLIGHT ═══ */}
      <div
        className="auth-hero-wrapper"
        ref={titleRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
      >
        <h1 className="auth-hero-title">
          <span className="auth-hero-title-base">Mente Serena</span>
          <span className="auth-hero-title-glow" aria-hidden="true">Mente Serena</span>
        </h1>
        <p className="auth-hero-subtitle">Seu espaço de paz e acolhimento</p>
      </div>

      <div className={`auth-container ${isRegister ? 'auth-register-mode' : ''}`}>
        {/* ═══ LEFT FORM PANEL (Login) ═══ */}
        <div className="auth-form-panel auth-form-login">
          <div className="auth-form-wrapper">
            <h2 className="auth-form-title auth-form-content">Entrar</h2>
            <p className="auth-form-subtitle auth-form-content">
              Acesse seu espaço de acolhimento
            </p>

            {!isRegister && error && (
              <div className="auth-error auth-form-field">{error}</div>
            )}

            <form onSubmit={!isRegister ? handleSubmit : (e) => e.preventDefault()}>
              <div className="auth-input-group auth-form-field">
                <Mail size={18} className="auth-input-icon" />
                <input
                  type="email"
                  placeholder="E-mail"
                  autoComplete="email"
                  value={!isRegister ? email : ''}
                  onChange={(e) => setEmail(e.target.value)}
                  required={!isRegister}
                  disabled={isRegister}
                  tabIndex={isRegister ? -1 : 0}
                />
              </div>

              <div className="auth-input-group auth-form-field">
                <Lock size={18} className="auth-input-icon" />
                <input
                  type="password"
                  placeholder="Senha"
                  autoComplete="current-password"
                  value={!isRegister ? password : ''}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!isRegister}
                  disabled={isRegister}
                  tabIndex={isRegister ? -1 : 0}
                />
              </div>

              <button
                className="auth-submit-btn auth-form-field"
                type="submit"
                disabled={loading || isRegister || !email || !password}
                tabIndex={isRegister ? -1 : 0}
              >
                {loading && !isRegister ? <Loader2 className="ds-spin-icon" size={20} /> : 'Entrar'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </div>
        </div>

        {/* ═══ RIGHT FORM PANEL (Register) ═══ */}
        <div className="auth-form-panel auth-form-register">
          <div className="auth-form-wrapper">
            <h2 className="auth-form-title auth-form-content">Criar Conta</h2>
            <p className="auth-form-subtitle auth-form-content">
              Comece sua jornada de bem-estar
            </p>

            {isRegister && error && (
              <div className="auth-error auth-form-field">{error}</div>
            )}

            <form onSubmit={isRegister ? handleSubmit : (e) => e.preventDefault()}>
              <div className="auth-input-group auth-form-field">
                <User size={18} className="auth-input-icon" />
                <input
                  type="text"
                  placeholder="Seu nome"
                  autoComplete="name"
                  value={isRegister ? name : ''}
                  onChange={(e) => setName(e.target.value)}
                  required={isRegister}
                  disabled={!isRegister}
                  tabIndex={!isRegister ? -1 : 0}
                />
              </div>

              <div className="auth-input-group auth-form-field">
                <Mail size={18} className="auth-input-icon" />
                <input
                  type="email"
                  placeholder="E-mail"
                  autoComplete="email"
                  value={isRegister ? email : ''}
                  onChange={(e) => setEmail(e.target.value)}
                  required={isRegister}
                  disabled={!isRegister}
                  tabIndex={!isRegister ? -1 : 0}
                />
              </div>

              <div className="auth-input-group auth-form-field">
                <Lock size={18} className="auth-input-icon" />
                <input
                  type="password"
                  placeholder="Senha"
                  autoComplete="new-password"
                  value={isRegister ? password : ''}
                  onChange={(e) => setPassword(e.target.value)}
                  required={isRegister}
                  disabled={!isRegister}
                  tabIndex={!isRegister ? -1 : 0}
                />
              </div>

              <button
                className="auth-submit-btn auth-form-field"
                type="submit"
                disabled={loading || !isRegister || !email || !password || !name}
                tabIndex={!isRegister ? -1 : 0}
              >
                {loading && isRegister ? <Loader2 className="ds-spin-icon" size={20} /> : 'Criar Conta'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </div>
        </div>

        {/* ═══ SLIDING OVERLAY ═══ */}
        <div className="auth-overlay" ref={overlayRef}>
          <div className="auth-overlay-gradient" />
          <div className="auth-overlay-panel auth-overlay-left">
            <div className="auth-overlay-content">
              <div className="auth-overlay-logo">
                <CatIcon size={52} />
              </div>
              <h2>Bem-vindo de volta!</h2>
              <p>
                Seu refúgio pessoal te espera. Entre e continue cuidando da sua mente com serenidade.
              </p>
              <div className="auth-overlay-features">
                <div className="auth-feature-pill">
                  <Shield size={14} />
                  <span>Espaço seguro</span>
                </div>
                <div className="auth-feature-pill">
                  <Heart size={14} />
                  <span>Acolhimento</span>
                </div>
              </div>
              <button
                className="auth-overlay-btn"
                onClick={() => switchMode(false)}
                type="button"
              >
                Entrar
              </button>
            </div>
          </div>

          <div className="auth-overlay-panel auth-overlay-right">
            <div className="auth-overlay-content">
              <div className="auth-overlay-logo">
                <CatIcon size={52} />
              </div>
              <h2>Comece Agora!</h2>
              <p>
                Crie seu espaço de paz e acolhimento. A jornada para uma mente serena começa aqui.
              </p>
              <div className="auth-overlay-features">
                <div className="auth-feature-pill">
                  <Sparkles size={14} />
                  <span>IA Terapêutica</span>
                </div>
                <div className="auth-feature-pill">
                  <Heart size={14} />
                  <span>Bem-estar</span>
                </div>
              </div>
              <button
                className="auth-overlay-btn"
                onClick={() => switchMode(true)}
                type="button"
              >
                Cadastrar
              </button>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
