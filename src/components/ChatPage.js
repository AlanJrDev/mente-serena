'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, Shield, Heart, User } from 'lucide-react';
import CatIcon from './CatIcon';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Typewriter Component
const Typewriter = ({ text, delay = 15 }) => {
  const [currentText, setCurrentText] = useState('');
  useEffect(() => {
    let index = 0;
    setCurrentText('');
    const interval = setInterval(() => {
      if (index < text.length) {
        setCurrentText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, delay);
    return () => clearInterval(interval);
  }, [text, delay]);
  return <span>{currentText}</span>;
};

export default function ChatPage({ sessionId = 'default', user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const containerRef = useRef(null);

  useGSAP(() => {
    if (messages.length === 0) {
      gsap.from('.ds-welcome', { y: 30, opacity: 0, duration: 0.6, ease: 'power3.out' });
      gsap.from('.ds-welcome-icon', { scale: 0, rotation: -15, duration: 0.8, delay: 0.2, ease: 'back.out(1.5)' });
    } else {
      // Wait for React to render the new bubble before animating
      requestAnimationFrame(() => {
        gsap.from('.ds-chat-bubble:last-child', { 
          y: 20, opacity: 0, scale: 0.95, duration: 0.4, ease: 'power2.out',
          clearProps: 'opacity,transform,scale' 
        });
      });
    }
  }, { scope: containerRef, dependencies: [messages.length] });

  // Load messages when sessionId changes
  useEffect(() => {
    setMessages([]); // Clear before loading
    fetchMessages();
  }, [sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const url = sessionId === 'default' ? '/api/messages' : `/api/messages?session_id=${sessionId}`;
      const res = await fetch(url, { headers: { 'x-user-id': user?.id }});
      if (!res.ok) throw new Error('Failed to load history');
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const isSendingRef = useRef(false);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || isSendingRef.current) return;

    isSendingRef.current = true;
    const userMessage = { role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsStreaming(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id
        },
        body: JSON.stringify({ message: trimmed, session_id: sessionId }),
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let aiContent = '';
      let aiThinking = '';
      const aiMessage = { role: 'ai', content: '', thinking: '' };
      setMessages(prev => [...prev, aiMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'thinking') {
                aiThinking += data.content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    thinking: aiThinking,
                  };
                  return updated;
                });
              } else if (data.type === 'content') {
                aiContent += data.content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: aiContent,
                  };
                  return updated;
                });
              } else if (data.type === 'done') {
                // streaming complete
              } else if (data.type === 'error') {
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: data.content || 'Desculpe, ocorreu um erro. Tente novamente.',
                  };
                  return updated;
                });
              }
            } catch (e) {
              // ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          content: 'Desculpe, não consegui processar sua mensagem. Verifique sua conexão e tente novamente.',
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      isSendingRef.current = false;
    }
  }, [input, isLoading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  return (
    <div className="ds-chat-container" ref={containerRef}>
      <div className="ds-chat-messages">
        {messages.length === 0 && (
          <div className="ds-welcome">
            <div className="ds-welcome-icon">
              <Shield size={48} strokeWidth={1.5} />
            </div>
            <h3>Bem-vindo ao Refúgio</h3>
            <p>
              <Typewriter text="Este é seu espaço seguro. Converse comigo sobre como você está se sentindo, seus pensamentos ou qualquer coisa que precise compartilhar. Estou aqui para ouvir e analisar o que você tem a dizer." />
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`ds-chat-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
            <span className="role-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              {msg.role === 'user' ? (
                <>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={14} />
                  </div>
                  <span>Você</span>
                </>
              ) : (
                <>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--ds-color-primary-subtle)', color: 'var(--ds-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CatIcon size={16} />
                  </div>
                  <span style={{ fontWeight: 800 }}>TUPI-2P</span>
                </>
              )}
            </span>
            {/* Show typing indicator only while streaming with no content yet */}
            {msg.role === 'ai' && !msg.content && isStreaming && i === messages.length - 1 && (
              <div className="ds-typing-indicator">
                <div className="ds-typing-dot"></div>
                <div className="ds-typing-dot"></div>
                <div className="ds-typing-dot"></div>
              </div>
            )}
            {/* Render message content ONCE */}
            {msg.content && (
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {msg.content}
                {msg.role === 'ai' && isStreaming && i === messages.length - 1 && (
                  <span style={{ display: 'inline-block', width: '6px', height: '14px', background: 'var(--ds-color-primary)', marginLeft: '4px', verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }}></span>
                )}
              </div>
            )}
            {msg.thinking && (
              <details className="ds-thought-process">
                <summary>
                  <CatIcon size={14} style={{ marginRight: 4 }} />
                  Processo de Raciocínio
                </summary>
                <div className="ds-thought-content">{msg.thinking}</div>
              </details>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <div className="ds-chat-input-area">
        <div className="ds-chat-input-row">
          <textarea
            ref={textareaRef}
            className="ds-chat-input"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Como você está se sentindo hoje?..."
            rows={1}
            disabled={isLoading}
            id="chat-input"
          />
          <button
            className="ds-btn-send"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            id="chat-send-btn"
            aria-label="Enviar mensagem"
          >
            {isLoading ? (
              <Loader2 size={20} className="ds-spin-icon" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
