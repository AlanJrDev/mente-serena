'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Shield, Heart, Footprints, TrendingUp, ChevronLeft, ChevronRight,
  Menu, X, User, Sprout, MessageSquare, Clock, Plus, Sun, Moon, LogOut
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Dynamic imports for code splitting
import ChatPage from '@/components/ChatPage';
import DiaryPage from '@/components/DiaryPage';
import TasksPage from '@/components/TasksPage';
import LoginPage from '@/components/LoginPage';

const DashboardPage = dynamic(() => import('@/components/DashboardPage'), {
  ssr: false,
  loading: () => (
    <div className="ds-page">
      <div className="ds-empty-state">
        <div className="ds-spinner" style={{ width: 40, height: 40, margin: '0 auto' }}></div>
        <p style={{ marginTop: '16px' }}>Carregando dashboard...</p>
      </div>
    </div>
  ),
});

const TABS = [
  { id: 'refugio', icon: Shield, label: 'Refúgio', subtitle: 'Chat com IA' },
  { id: 'ritmo', icon: Heart, label: 'Meu Ritmo', subtitle: 'Diário' },
  { id: 'passos', icon: Footprints, label: 'Pequenos Passos', subtitle: 'Tarefas' },
  { id: 'espelho', icon: TrendingUp, label: 'Espelho da Mente', subtitle: 'Dashboard' },
];

import CatIcon from '@/components/CatIcon';

export default function Home() {
  const [activeTab, setActiveTab] = useState('refugio');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const containerRef = useRef(null);

  useGSAP(() => {
    if (!user) return;
    gsap.from('.ds-nav-item', { x: -20, opacity: 0, stagger: 0.05, duration: 0.4, ease: 'power2.out' });
    gsap.from('.ds-main', { opacity: 0, duration: 0.6, ease: 'power2.out', clearProps: 'all' });
  }, { scope: containerRef, dependencies: [user] });

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync theme
  useEffect(() => {
    const saved = localStorage.getItem('mente-serena-theme') || 'dark';
    setTheme(saved);
  }, []);

  // Always clear cache on start to enforce a fresh login state
  useEffect(() => {
    localStorage.removeItem('mente-serena-user');
    setUser(null);
    setIsAuthChecking(false);
    setCurrentSessionId(Date.now().toString());
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mente-serena-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const startNewSession = () => {
    setCurrentSessionId(Date.now().toString());
    setActiveTab('refugio');
    if (window.innerWidth <= 768) setIsMobileMenuOpen(false);
  };

  const openSession = (sessionId) => {
    setCurrentSessionId(sessionId);
    setActiveTab('refugio');
    if (window.innerWidth <= 768) setIsMobileMenuOpen(false);
  };

  // Load conversation history
  useEffect(() => {
    if (user) fetchChatHistory();
  }, [currentSessionId, user]);

  const fetchChatHistory = async () => {
    try {
      const res = await fetch('/api/messages', {
        headers: { 'x-user-id': user.id }
      });
      if (res.ok) {
        const messages = await res.json();
        const grouped = {};
        messages.forEach(msg => {
          if (msg.role === 'user') {
            const sessId = msg.session_id || 'default';
            if (!grouped[sessId]) grouped[sessId] = [];
            grouped[sessId].push(msg);
          }
        });
        const history = Object.entries(grouped).map(([sessId, msgs]) => ({
          sessionId: sessId,
          date: new Date(msgs[msgs.length - 1].created_at || new Date()).toLocaleDateString('pt-BR'),
          preview: msgs[msgs.length - 1].content.substring(0, 40) + (msgs[msgs.length - 1].content.length > 40 ? '...' : ''),
        }));
        setChatHistory(history.slice(-5).reverse());
      }
    } catch (err) {
      // Silently ignore
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'refugio':
        return currentSessionId ? <ChatPage sessionId={currentSessionId} user={user} /> : null;
      case 'ritmo':
        return <DiaryPage user={user} />;
      case 'passos':
        return <TasksPage user={user} />;
      case 'espelho':
        return <DashboardPage user={user} />;
      default:
        return currentSessionId ? <ChatPage sessionId={currentSessionId} user={user} /> : null;
    }
  };

  const handleLogin = (u) => {
    setUser(u);
    localStorage.setItem('mente-serena-user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('mente-serena-user');
    setCurrentSessionId('');
    setChatHistory([]);
  };

  if (isAuthChecking) {
    return (
      <div className="ds-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--ds-bg-main)' }}>
        <div className="ds-spinner" style={{ width: 40, height: 40}}></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="ds-app-layout" ref={containerRef}>
      {/* Mobile Menu Button */}
      <button
        className="ds-mobile-menu-btn"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Menu"
        id="mobile-menu-btn"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`ds-sidebar ${isSidebarOpen ? '' : 'collapsed'} ${isMobileMenuOpen ? 'mobile-open' : ''}`}
        id="sidebar"
      >
        <div className="ds-sidebar-header">
          <div className="ds-sidebar-logo" style={{ background: 'transparent', boxShadow: 'none' }}>
            <CatIcon size={36} />
          </div>
          <div className="ds-sidebar-brand">
            <h1>Mente Serena</h1>
            <span>Seu espaço de paz</span>
          </div>
        </div>

        <nav className="ds-sidebar-nav">
          {TABS.map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                className={`ds-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
                id={`nav-${tab.id}`}
                title={tab.label}
              >
                <span className="ds-nav-icon"><IconComp size={20} /></span>
                <div className="ds-nav-label">
                  <div style={{ fontWeight: 600 }}>{tab.label}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--ds-text-muted)', marginTop: '1px' }}>
                    {tab.subtitle}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Conversation History */}
          {!isSidebarOpen ? null : (
            <div style={{ marginTop: 'var(--ds-space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--ds-space-md)', marginBottom: 'var(--ds-space-sm)' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  fontSize: 'var(--ds-font-size-xs)', color: 'var(--ds-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600,
                }}>
                  <Clock size={12} /> Histórico
                </div>
                <button onClick={startNewSession} style={{ background: 'transparent', border: 'none', color: 'var(--ds-color-primary)', cursor: 'pointer' }} title="Nova Conversa">
                  <Plus size={16} />
                </button>
              </div>
              
              {chatHistory.length === 0 ? (
                <div style={{
                  padding: 'var(--ds-space-sm) var(--ds-space-md)',
                  fontSize: 'var(--ds-font-size-xs)',
                  color: 'var(--ds-text-muted)',
                }}>
                  Nenhuma conversa ainda
                </div>
              ) : (
                chatHistory.map((item, i) => (
                  <button
                    key={i}
                    className={`ds-nav-item ${currentSessionId === item.sessionId && activeTab === 'refugio' ? 'active' : ''}`}
                    onClick={() => openSession(item.sessionId)}
                    style={{ padding: '6px var(--ds-space-md)', minHeight: 44, borderRadius: '8px' }}
                  >
                    <span className="ds-nav-icon"><MessageSquare size={14} /></span>
                    <div className="ds-nav-label">
                      <div style={{ fontSize: 'var(--ds-font-size-xs)', color: 'var(--ds-text-secondary)' }}>
                        {item.preview}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--ds-text-muted)' }}>
                        {item.date}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* User Profile Section & Theme Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--ds-space-sm)',
            padding: 'var(--ds-space-sm)',
            borderRadius: 'var(--ds-radius-main)',
            background: 'rgba(255,255,255,0.03)',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: 'var(--ds-bg-elevated)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                color: 'var(--ds-color-primary)',
              }}>
                <Sprout size={18} />
              </div>
              <div className="ds-nav-label">
                <div style={{ fontWeight: 600, fontSize: 'var(--ds-font-size-sm)' }}>
                  {user?.name || 'Você'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--ds-text-muted)' }}>Cuidando de mim</div>
              </div>
            </div>
            {!isSidebarOpen ? null : (
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={toggleTheme} className="ds-sidebar-toggle" style={{ width: 32, height: 32, flexShrink: 0, borderRadius: '8px' }} title="Alterar tema">
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <button onClick={handleLogout} className="ds-sidebar-toggle" style={{ width: 32, height: 32, flexShrink: 0, borderRadius: '8px', color: '#f87171' }} title="Sair da conta">
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </nav>

        <div className="ds-sidebar-footer">
          <button
            className="ds-sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? 'Recolher menu' : 'Expandir menu'}
            id="sidebar-toggle"
          >
            {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 50,
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`ds-main ${isSidebarOpen ? '' : 'sidebar-collapsed'}`} id="main-content">
        {renderPage()}
      </main>
    </div>
  );
}
