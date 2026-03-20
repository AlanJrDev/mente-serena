'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  ComposedChart,
} from 'recharts';
import {
  BarChart3, Zap, Smile, Flame, TrendingUp, PieChart as PieIcon,
  BarChart2, ClipboardList, Loader2, GitCompareArrows
} from 'lucide-react';

const BRAND_COLORS = {
  primary: '#4D6BFE',
  secondary: '#7C3AED',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
};

const MOOD_ICON_MAP = {
  feliz: Smile,
  calmo: Smile,
  energético: Zap,
  neutro: BarChart2,
  ansioso: Flame,
  triste: Smile,
  irritado: Flame,
  exausto: Zap,
};

const MOOD_COLOR_MAP = {
  feliz: BRAND_COLORS.success,
  calmo: BRAND_COLORS.info,
  energético: BRAND_COLORS.warning,
  neutro: '#9CA3AF',
  ansioso: BRAND_COLORS.danger,
  triste: '#8B5CF6',
  irritado: '#F97316',
  exausto: '#6B7280',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1F2937',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <p style={{ color: '#9CA3AF', fontSize: '0.8rem', marginBottom: '4px' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color, fontWeight: 600, fontSize: '0.9rem' }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage({ user }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchDashboard();
  }, [timeRange]);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/dashboard?range=${timeRange}`, {
        headers: { 'x-user-id': user?.id }
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !dashboardData) {
    return (
      <div className="ds-page">
        <div className="ds-page-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <TrendingUp size={28} strokeWidth={2} /> Espelho da Mente
          </h2>
          <p>Carregando seus dados...</p>
        </div>
        <div className="ds-empty-state">
          <Loader2 size={40} className="ds-spin-icon" style={{ margin: '0 auto', display: 'block' }} />
        </div>
      </div>
    );
  }

  const { stats, energyOverTime, moodDistribution, moodOverTime, correlationData } = dashboardData;

  return (
    <div className="ds-page">
      <div className="ds-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <TrendingUp size={28} strokeWidth={2} /> Espelho da Mente
          </h2>
          <p>Uma visão panorâmica do seu bem-estar emocional ao longo do tempo.</p>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { value: '30d', label: '1 Mês' },
            { value: '90d', label: '3 Meses' },
            { value: '180d', label: '6 Meses' },
            { value: '365d', label: '1 Ano' },
          ].map(opt => (
            <button
              key={opt.value}
              className={`ds-btn ${timeRange === opt.value ? 'ds-btn-primary' : 'ds-btn-secondary'}`}
              onClick={() => setTimeRange(opt.value)}
              style={{ padding: '6px 14px', minHeight: '36px', fontSize: '0.8rem' }}
              id={`range-${opt.value}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="ds-stats-grid">
        <div className="ds-stat-card">
          <div className="ds-stat-icon"><BarChart3 size={28} /></div>
          <div className="ds-stat-value">{stats.totalLogs}</div>
          <div className="ds-stat-label">Registros Totais</div>
        </div>
        <div className="ds-stat-card">
          <div className="ds-stat-icon"><Zap size={28} /></div>
          <div className="ds-stat-value">{stats.avgEnergy}</div>
          <div className="ds-stat-label">Energia Média</div>
        </div>
        <div className="ds-stat-card">
          <div className="ds-stat-icon"><Smile size={28} /></div>
          <div className="ds-stat-value" style={{ fontSize: 'var(--ds-font-size-xl)' }}>{stats.dominantMood || '—'}</div>
          <div className="ds-stat-label">Humor Predominante</div>
        </div>
        <div className="ds-stat-card">
          <div className="ds-stat-icon"><Flame size={28} /></div>
          <div className="ds-stat-value">{stats.streak}</div>
          <div className="ds-stat-label">Dias Consecutivos</div>
        </div>
      </div>

      {/* Cross-reference Chart: Energy x Mood x Sleep */}
      {correlationData && correlationData.length > 0 && (
        <div className="ds-chart-container">
          <div className="ds-chart-title">
            <GitCompareArrows size={20} /> Correlação: Energia × Humor × Sono
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={correlationData}>
              <defs>
                <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND_COLORS.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={BRAND_COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                stroke="#6B7280"
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                domain={[0, 10]}
                stroke="#6B7280"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                label={{ value: 'Nível', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ color: '#9CA3AF', fontSize: '0.8rem' }}
              />
              <Area
                type="monotone"
                dataKey="energy"
                name="Energia"
                stroke={BRAND_COLORS.primary}
                strokeWidth={2}
                fill="url(#energyGrad)"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="moodScore"
                name="Humor"
                stroke={BRAND_COLORS.success}
                strokeWidth={2}
                dot={{ fill: BRAND_COLORS.success, r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="sleepScore"
                name="Sono"
                stroke={BRAND_COLORS.warning}
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={{ fill: BRAND_COLORS.warning, r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Energy Over Time Chart (fallback / simpler view) */}
      {(!correlationData || correlationData.length === 0) && (
        <div className="ds-chart-container">
          <div className="ds-chart-title">
            <Zap size={20} /> Nível de Energia ao Longo do Tempo
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={energyOverTime}>
              <defs>
                <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND_COLORS.primary} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={BRAND_COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                stroke="#6B7280"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                domain={[0, 10]}
                stroke="#6B7280"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="energy"
                name="Energia"
                stroke={BRAND_COLORS.primary}
                strokeWidth={3}
                fill="url(#energyGradient)"
                dot={{ fill: BRAND_COLORS.primary, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: BRAND_COLORS.primary, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="ds-grid-2">
        {/* Mood Distribution Pie */}
        <div className="ds-chart-container">
          <div className="ds-chart-title">
            <PieIcon size={20} /> Distribuição de Humor
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={moodDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="count"
                nameKey="mood"
                label={({ mood, percent }) => `${mood} ${(percent * 100).toFixed(0)}%`}
              >
                {moodDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={MOOD_COLOR_MAP[entry.mood] || BRAND_COLORS.primary}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Mood Timeline */}
        <div className="ds-chart-container">
          <div className="ds-chart-title">
            <BarChart2 size={20} /> Humor ao Longo do Tempo
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={moodOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                stroke="#6B7280"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                stroke="#6B7280"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="moodScore"
                name="Humor"
                fill={BRAND_COLORS.primary}
                radius={[6, 6, 0, 0]}
              >
                {moodOverTime.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={MOOD_COLOR_MAP[entry.mood] || BRAND_COLORS.primary}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Entries */}
      {dashboardData.recentEntries && dashboardData.recentEntries.length > 0 && (
        <div className="ds-chart-container" style={{ marginTop: 'var(--ds-space-lg)' }}>
          <div className="ds-chart-title">
            <ClipboardList size={20} /> Entradas Recentes
          </div>
          <div style={{ display: 'grid', gap: 'var(--ds-space-sm)' }}>
            {dashboardData.recentEntries.map((entry, i) => {
              const IconComp = MOOD_ICON_MAP[entry.mood] || Smile;
              return (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--ds-space-md)',
                  padding: 'var(--ds-space-sm) var(--ds-space-md)',
                  borderRadius: 'var(--ds-radius-main)',
                  background: 'rgba(255,255,255,0.03)',
                }}>
                  <div style={{ color: MOOD_COLOR_MAP[entry.mood] || 'var(--ds-text-secondary)' }}>
                    <IconComp size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--ds-font-size-sm)' }}>
                      {entry.mood} — Energia: {entry.energy}/10
                    </div>
                    {entry.notes && (
                      <div style={{ fontSize: 'var(--ds-font-size-xs)', color: 'var(--ds-text-tertiary)' }}>
                        {entry.notes}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 'var(--ds-font-size-xs)', color: 'var(--ds-text-muted)' }}>
                    {entry.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
