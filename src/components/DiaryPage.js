'use client';

import { useState } from 'react';
import {
  Smile, CloudSun, Zap, Minus, AlertTriangle, CloudRain,
  Flame, Battery, Moon, FileText, Heart, Save, Loader2,
  CheckCircle, AlertCircle
} from 'lucide-react';

const MOODS = [
  { icon: Smile, value: 'feliz', label: 'Feliz' },
  { icon: CloudSun, value: 'calmo', label: 'Calmo' },
  { icon: Zap, value: 'energético', label: 'Energético' },
  { icon: Minus, value: 'neutro', label: 'Neutro' },
  { icon: AlertTriangle, value: 'ansioso', label: 'Ansioso' },
  { icon: CloudRain, value: 'triste', label: 'Triste' },
  { icon: Flame, value: 'irritado', label: 'Irritado' },
  { icon: Battery, value: 'exausto', label: 'Exausto' },
];

const SLEEP_OPTIONS = [
  { value: 'excelente', label: 'Excelente' },
  { value: 'bom', label: 'Bom' },
  { value: 'regular', label: 'Regular' },
  { value: 'ruim', label: 'Ruim' },
  { value: 'pessimo', label: 'Péssimo' },
];

export default function DiaryPage({ user }) {
  const [mood, setMood] = useState('neutro');
  const [energy, setEnergy] = useState(5);
  const [sleepQuality, setSleepQuality] = useState('');
  const [notes, setNotes] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mood) {
      showToast('Por favor, selecione como você está se sentindo.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id
        },
        body: JSON.stringify({
          mood,
          energy,
          notes,
          sleepQuality,
          gratitude,
        }),
      });

      if (res.ok) {
        showToast('Registro salvo com sucesso!');
        setMood('');
        setEnergy(5);
        setSleepQuality('');
        setNotes('');
        setGratitude('');
      } else {
        showToast('Erro ao salvar. Tente novamente.', 'error');
      }
    } catch (err) {
      showToast('Erro de conexão. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEnergyIcon = () => {
    if (energy <= 3) return <Battery size={28} />;
    if (energy <= 6) return <Minus size={28} />;
    if (energy <= 8) return <Zap size={28} />;
    return <Flame size={28} />;
  };

  return (
    <div className="ds-page">
      <div className="ds-page-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Heart size={28} strokeWidth={2} /> Meu Ritmo
        </h2>
        <p>Registre como você está se sentindo hoje. Cada anotação ajuda a entender seus padrões.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="ds-diary-grid">
          {/* Mood Section */}
          <div className="ds-diary-section">
            <h3>
              <CloudSun size={20} /> Como você está se sentindo?
            </h3>
            <div className="ds-mood-grid">
              {MOODS.map((m) => {
                const IconComp = m.icon;
                return (
                  <button
                    key={m.value}
                    type="button"
                    className={`ds-mood-option ${mood === m.value ? 'selected' : ''}`}
                    onClick={() => setMood(m.value)}
                    id={`mood-${m.value}`}
                  >
                    <span className="emoji"><IconComp size={28} strokeWidth={1.5} /></span>
                    <span className="label">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Energy Section */}
          <div className="ds-diary-section">
            <h3>
              <Zap size={20} /> Nível de Energia
            </h3>
            <div className="ds-slider-container">
              <div style={{ textAlign: 'center', marginBottom: '8px', color: 'var(--ds-color-primary)' }}>
                {getEnergyIcon()}
              </div>
              <input
                type="range"
                className="ds-slider"
                min="1"
                max="10"
                value={energy}
                onChange={(e) => setEnergy(parseInt(e.target.value))}
                id="energy-slider"
                style={{
                  background: `linear-gradient(to right, var(--ds-color-primary) ${(energy - 1) * 11.11}%, var(--ds-bg-elevated) ${(energy - 1) * 11.11}%)`,
                }}
              />
              <div className="ds-slider-labels">
                <span>Sem energia</span>
                <span style={{ fontWeight: 700, color: 'var(--ds-color-primary)', fontSize: 'var(--ds-font-size-lg)' }}>{energy}/10</span>
                <span>Muito energético</span>
              </div>
            </div>
          </div>

          {/* Sleep Quality */}
          <div className="ds-diary-section">
            <h3>
              <Moon size={20} /> Qualidade do Sono
            </h3>
            <div className="ds-mood-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
              {SLEEP_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`ds-mood-option ${sleepQuality === opt.value ? 'selected' : ''}`}
                  onClick={() => setSleepQuality(opt.value)}
                  id={`sleep-${opt.value}`}
                >
                  <span className="label" style={{ fontSize: 'var(--ds-font-size-sm)' }}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes & Gratitude */}
          <div className="ds-grid-2">
            <div className="ds-diary-section">
              <h3>
                <FileText size={20} /> Diário Livre
              </h3>
              <textarea
                className="ds-textarea"
                placeholder="O que está na sua mente? Desabafe, reflita, compartilhe..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                id="diary-notes"
                rows={4}
              />
            </div>

            <div className="ds-diary-section">
              <h3>
                <Heart size={20} /> Gratidão
              </h3>
              <textarea
                className="ds-textarea"
                placeholder="Pelo que você é grato hoje? (ex: saúde, família, um café gostoso...)"
                value={gratitude}
                onChange={(e) => setGratitude(e.target.value)}
                id="diary-gratitude"
                rows={4}
              />
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--ds-space-md)' }}>
            <button
              type="submit"
              className="ds-btn ds-btn-primary"
              disabled={isSubmitting}
              id="diary-submit"
              style={{ minWidth: 200, fontSize: 'var(--ds-font-size-base)' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="ds-spin-icon" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={18} /> Salvar Registro
                </>
              )}
            </button>
          </div>
        </div>
      </form>

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
