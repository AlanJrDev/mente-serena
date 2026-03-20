'use client';

import { useState, useEffect } from 'react';
import {
  Footprints, Bot, Loader2, ClipboardList, CheckCircle,
  AlertCircle, Wind, Dumbbell, Lightbulb, Users, Palette,
  Sparkles, Heart as HeartIcon
} from 'lucide-react';

const CATEGORY_ICONS = {
  'respiração': Wind,
  'exercício': Dumbbell,
  'reflexão': Lightbulb,
  'social': Users,
  'criatividade': Palette,
  'autocuidado': HeartIcon,
  'geral': Sparkles,
};

export default function TasksPage({ user }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks', {
        headers: { 'x-user-id': user?.id }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTask = async (taskId, currentStatus) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId ? { ...t, is_completed: currentStatus ? 0 : 1 } : t
      )
    );

    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id
        },
        body: JSON.stringify({ taskId, isCompleted: !currentStatus }),
      });

      if (!res.ok) {
        setTasks(prev =>
          prev.map(t =>
            t.id === taskId ? { ...t, is_completed: currentStatus ? 1 : 0 } : t
          )
        );
        showToast('Erro ao atualizar tarefa.', 'error');
      }
    } catch (err) {
      showToast('Erro de conexão.', 'error');
    }
  };

  const generateNewTasks = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-steps', {
        method: 'POST',
        headers: { 'x-user-id': user?.id }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tasks && data.tasks.length > 0) {
          setTasks(prev => [...data.tasks, ...prev]);
          showToast(`${data.tasks.length} novas tarefas geradas pela IA!`);
        } else {
          showToast('A IA não conseguiu gerar novas tarefas agora. Tente mais tarde.', 'error');
        }
      } else {
        showToast('Erro ao gerar tarefas.', 'error');
      }
    } catch (err) {
      showToast('Erro de conexão.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const pendingTasks = tasks.filter(t => !t.is_completed);
  const completedTasks = tasks.filter(t => t.is_completed);
  const progress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const getCategoryIcon = (category) => {
    const IconComp = CATEGORY_ICONS[category] || Sparkles;
    return <IconComp size={12} />;
  };

  return (
    <div className="ds-page">
      <div className="ds-page-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Footprints size={28} strokeWidth={2} /> Pequenos Passos
        </h2>
        <p>Tarefas sugeridas pela IA baseadas no seu estado emocional. Cada pequeno passo conta!</p>
      </div>

      {/* Progress Bar */}
      <div className="ds-card" style={{ marginBottom: 'var(--ds-space-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--ds-space-md)' }}>
          <span style={{ fontWeight: 600 }}>Progresso de Hoje</span>
          <span className="ds-badge ds-badge-primary">{completedTasks.length}/{tasks.length} concluídas</span>
        </div>
        <div style={{
          height: 8,
          borderRadius: 'var(--ds-radius-pill)',
          background: 'var(--ds-bg-elevated)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            borderRadius: 'var(--ds-radius-pill)',
            background: 'linear-gradient(90deg, var(--ds-color-primary), var(--ds-color-secondary))',
            transition: 'width 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
          }} />
        </div>
      </div>

      {/* Generate Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--ds-space-lg)' }}>
        <button
          className="ds-btn ds-btn-primary"
          onClick={generateNewTasks}
          disabled={isGenerating}
          id="generate-tasks-btn"
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="ds-spin-icon" />
              Gerando...
            </>
          ) : (
            <>
              <Bot size={16} /> Gerar Novas Tarefas
            </>
          )}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="ds-empty-state">
          <Loader2 size={40} className="ds-spin-icon" style={{ margin: '0 auto', display: 'block' }} />
          <p style={{ marginTop: 'var(--ds-space-md)' }}>Carregando suas tarefas...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && tasks.length === 0 && (
        <div className="ds-empty-state">
          <Sparkles size={48} style={{ margin: '0 auto', display: 'block', marginBottom: '16px' }} />
          <h3>Nenhuma tarefa por aqui</h3>
          <p>
            Clique em &ldquo;Gerar Novas Tarefas&rdquo; para que a IA crie sugestões personalizadas com base no seu estado emocional.
          </p>
        </div>
      )}

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div style={{ marginBottom: 'var(--ds-space-xl)' }}>
          <h3 style={{ fontSize: 'var(--ds-font-size-lg)', fontWeight: 700, marginBottom: 'var(--ds-space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={20} /> Pendentes ({pendingTasks.length})
          </h3>
          <div style={{ display: 'grid', gap: 'var(--ds-space-sm)' }}>
            {pendingTasks.map((task) => (
              <div key={task.id} className="ds-ai-card">
                <div className="ds-task-item">
                  <div className="ds-checkbox">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => toggleTask(task.id, false)}
                      id={`task-${task.id}`}
                    />
                    <span className="checkmark"></span>
                  </div>
                  <div className="ds-task-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="ds-task-title">{task.title}</span>
                      <span className="ds-badge ds-badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {getCategoryIcon(task.category)} {task.category}
                      </span>
                    </div>
                    {task.description && (
                      <div className="ds-task-description">{task.description}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h3 style={{ fontSize: 'var(--ds-font-size-lg)', fontWeight: 700, marginBottom: 'var(--ds-space-md)', color: 'var(--ds-color-accent-success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={20} /> Concluídas ({completedTasks.length})
          </h3>
          <div style={{ display: 'grid', gap: 'var(--ds-space-sm)', opacity: 0.7 }}>
            {completedTasks.map((task) => (
              <div key={task.id} className="ds-card">
                <div className="ds-task-item completed">
                  <div className="ds-checkbox">
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => toggleTask(task.id, true)}
                      id={`task-done-${task.id}`}
                    />
                    <span className="checkmark"></span>
                  </div>
                  <div className="ds-task-content">
                    <span className="ds-task-title">{task.title}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`ds-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
