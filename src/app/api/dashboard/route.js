import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

const MOOD_SCORE_MAP = {
  feliz: 9,
  energético: 8,
  calmo: 7,
  neutro: 5,
  ansioso: 3,
  irritado: 3,
  triste: 2,
  exausto: 2,
};

const SLEEP_SCORE_MAP = {
  excelente: 10,
  bom: 8,
  regular: 5,
  ruim: 3,
  pessimo: 1,
};

// GET /api/dashboard — fetch aggregated dashboard data
export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const days = parseInt(range) || 30;

    // Fetch mood logs within range using Postgres interval
    const { rows: moodLogs } = await sql`
      SELECT mood, energy, notes, sleep_quality, logged_at 
      FROM mood_logs 
      WHERE user_id = ${userId} 
        AND logged_at >= NOW() - (${days} || ' days')::interval
      ORDER BY logged_at ASC
    `;

    // Stats
    const totalLogs = moodLogs.length;
    const avgEnergy = totalLogs > 0
      ? (moodLogs.reduce((sum, m) => sum + m.energy, 0) / totalLogs).toFixed(1)
      : '0';

    // Dominant mood
    const moodCounts = {};
    moodLogs.forEach(m => {
      moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
    });
    const dominantMood = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])?.[0]?.[0] || '';

    // Streak calculation
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      const hasLog = moodLogs.some(m => {
        const logDate = new Date(m.logged_at).toISOString().split('T')[0];
        return logDate === dateStr;
      });
      if (hasLog || i === 0) {
        if (hasLog) streak++;
        else break;
      } else {
        break;
      }
    }

    // Energy over time
    const energyOverTime = moodLogs.map(m => ({
      date: new Date(m.logged_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      energy: m.energy,
    }));

    // Mood distribution
    const moodDistribution = Object.entries(moodCounts).map(([mood, count]) => ({
      mood,
      count,
      name: mood,
    }));

    // Mood over time (with scores)
    const moodOverTime = moodLogs.map(m => ({
      date: new Date(m.logged_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      mood: m.mood,
      moodScore: MOOD_SCORE_MAP[m.mood] || 5,
    }));

    // Correlation data: Energy x Mood x Sleep
    const correlationData = moodLogs.map(m => ({
      date: new Date(m.logged_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      energy: m.energy,
      moodScore: MOOD_SCORE_MAP[m.mood] || 5,
      sleepScore: m.sleep_quality ? (SLEEP_SCORE_MAP[m.sleep_quality] || 5) : null,
      mood: m.mood,
      sleep: m.sleep_quality || null,
    }));

    // Recent entries
    const recentEntries = moodLogs.slice(-7).reverse().map(m => ({
      mood: m.mood,
      energy: m.energy,
      notes: m.notes,
      date: new Date(m.logged_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    }));

    return NextResponse.json({
      stats: {
        totalLogs,
        avgEnergy,
        dominantMood,
        streak,
      },
      energyOverTime,
      moodDistribution,
      moodOverTime,
      correlationData,
      recentEntries,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return NextResponse.json({
      stats: { totalLogs: 0, avgEnergy: '0', dominantMood: '', streak: 0 },
      energyOverTime: [],
      moodDistribution: [],
      moodOverTime: [],
      correlationData: [],
      recentEntries: [],
    });
  }
}
