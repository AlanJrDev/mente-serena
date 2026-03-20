'use client';

import { useState, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ArrowRight, User, Lock, Mail, Loader2 } from 'lucide-react';
import CatIcon from './CatIcon';

export default function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const containerRef = useRef(null);

  useGSAP(() => {
    gsap.from('.ds-login-card', { y: 40, opacity: 0, duration: 0.8, ease: 'power3.out', clearProps: 'opacity,transform' });
    gsap.from('.ds-login-logo', { scale: 0, rotation: -20, duration: 0.8, delay: 0.2, ease: 'back.out(1.5)', clearProps: 'opacity,transform' });
    gsap.from('.ds-login-elements', { y: 20, opacity: 0, stagger: 0.1, duration: 0.6, delay: 0.4, ease: 'power2.out', clearProps: 'opacity,transform' });
  }, { scope: containerRef });

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

  return (
    <div className="ds-app-layout" style={{ justifyContent: 'center', alignItems: 'center', background: 'var(--ds-bg-deep)' }} ref={containerRef}>
      <div className="ds-login-card" style={{
        background: 'var(--ds-glass-bg)',
        backdropFilter: 'blur(var(--ds-glass-blur))',
        WebkitBackdropFilter: 'blur(var(--ds-glass-blur))',
        border: '1px solid var(--ds-glass-border)',
        borderRadius: 'var(--ds-radius-lg)',
        padding: 'var(--ds-space-2xl)',
        width: '100%',
        maxWidth: '420px',
        textAlign: 'center',
        boxShadow: 'var(--ds-shadow-lg)'
      }}>
        
        <div className="ds-login-logo" style={{
          width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--ds-color-primary), var(--ds-color-secondary))',
          margin: '0 auto var(--ds-space-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(77, 107, 254, 0.4)'
        }}>
          <CatIcon size={48} />
        </div>

        <h1 className="ds-login-elements" style={{
          fontSize: 'var(--ds-font-size-2xl)', fontWeight: 800, marginBottom: 'var(--ds-space-sm)',
          background: 'linear-gradient(135deg, var(--ds-text-primary), var(--ds-text-secondary))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>Mente Serena</h1>
        
        <p className="ds-login-elements" style={{ color: 'var(--ds-text-secondary)', marginBottom: 'var(--ds-space-xl)' }}>
          {isRegister ? 'Crie seu espaço seguro.' : 'Bem-vindo de volta ao seu refúgio.'}
        </p>

        <div style={{ display: 'flex', marginBottom: 'var(--ds-space-lg)', borderBottom: '1px solid var(--ds-glass-border)' }}>
          <button 
            className="ds-login-elements"
            onClick={() => { setIsRegister(false); setError(''); }}
            type="button"
            style={{ 
              flex: 1, padding: '12px', background: 'none', border: 'none', color: !isRegister ? 'var(--ds-color-primary)' : 'var(--ds-text-muted)', 
              fontWeight: 600, borderBottom: !isRegister ? '2px solid var(--ds-color-primary)' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.3s'
            }}
          >
            Entrar
          </button>
          <button 
            className="ds-login-elements"
            onClick={() => { setIsRegister(true); setError(''); }}
            type="button"
            style={{ 
              flex: 1, padding: '12px', background: 'none', border: 'none', color: isRegister ? 'var(--ds-color-primary)' : 'var(--ds-text-muted)', 
              fontWeight: 600, borderBottom: isRegister ? '2px solid var(--ds-color-primary)' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.3s'
            }}
          >
            Cadastro
          </button>
        </div>

        {error && (
          <div className="ds-login-elements" style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="ds-login-elements" style={{ position: 'relative', marginBottom: 'var(--ds-space-md)' }}>
              <User size={20} style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--ds-text-muted)' }} />
              <input
                type="text"
                className="ds-input"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ paddingLeft: '48px', height: '52px' }}
                required={isRegister}
              />
            </div>
          )}
          
          <div className="ds-login-elements" style={{ position: 'relative', marginBottom: 'var(--ds-space-md)' }}>
            <Mail size={20} style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--ds-text-muted)' }} />
            <input
              type="email"
              className="ds-input"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ paddingLeft: '48px', height: '52px' }}
              required
            />
          </div>

          <div className="ds-login-elements" style={{ position: 'relative', marginBottom: 'var(--ds-space-xl)' }}>
            <Lock size={20} style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--ds-text-muted)' }} />
            <input
              type="password"
              className="ds-input"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingLeft: '48px', height: '52px' }}
              required
            />
          </div>
          
          <button 
            className="ds-btn ds-btn-primary ds-login-elements" 
            type="submit" 
            disabled={loading || !email || !password || (isRegister && !name)}
            style={{ width: '100%', height: '52px', fontSize: 'var(--ds-font-size-base)', justifyContent: 'center' }}
          >
            {loading ? <Loader2 className="ds-spin-icon" /> : (isRegister ? 'Criar Conta' : 'Entrar')}
          </button>
        </form>

      </div>
    </div>
  );
}
