import getDb, { uuidv4 } from '@/lib/db';
import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// POST /api/generate-steps — generate AI tasks based on mood/chat history
export async function POST(request) {
  try {
    const db = getDb();

    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Gather context
    const recentMoods = db.prepare(
      'SELECT mood, energy, notes, logged_at FROM mood_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 5'
    ).all(userId);

    const recentMessages = db.prepare(
      'SELECT role, content FROM messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 10'
    ).all(userId);

    if (!GROQ_API_KEY) {
      // Fallback: generate contextual tasks without API
      return generateFallbackTasks(db, recentMoods, userId);
    }

    // Build prompt for task generation
    const moodSummary = recentMoods.length > 0
      ? recentMoods.map(m => `- ${m.logged_at}: humor "${m.mood}", energia ${m.energy}/10${m.notes ? ` (${m.notes})` : ''}`).join('\n')
      : 'Nenhum registro de humor recente.';

    const chatSummary = recentMessages.length > 0
      ? recentMessages.reverse().map(m => `${m.role === 'user' ? 'Usuário' : 'IA'}: ${m.content.substring(0, 100)}`).join('\n')
      : 'Nenhuma conversa recente.';

    const prompt = `Com base no estado emocional recente do usuário, gere EXATAMENTE 3 tarefas de bem-estar personalizadas.

HISTÓRICO DE HUMOR:
${moodSummary}

CONVERSAS RECENTES:
${chatSummary}

Responda APENAS com um JSON válido no seguinte formato:
{
  "tasks": [
    {
      "title": "Título curto da tarefa",
      "description": "Descrição detalhada de como realizar a tarefa e por que ela ajuda",
      "category": "respiração|exercício|reflexão|social|criatividade|autocuidado"
    }
  ]
}

As tarefas devem ser:
- Realistas e fazíveis em poucos minutos
- Personalizadas para o estado emocional atual
- Variadas em categorias
- Escritas em português brasileiro`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'Você é um assistente de bem-estar mental. Responda APENAS com JSON válido.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
    });

    if (!groqResponse.ok) {
      console.error('Groq API error:', groqResponse.status);
      return generateFallbackTasks(db, recentMoods, userId);
    }

    const groqData = await groqResponse.json();
    const responseContent = groqData.choices?.[0]?.message?.content;

    let parsed;
    try {
      parsed = JSON.parse(responseContent);
    } catch (e) {
      console.error('Failed to parse Groq response:', responseContent);
      return generateFallbackTasks(db, recentMoods, userId);
    }

    const newTasks = [];
    if (parsed.tasks && Array.isArray(parsed.tasks)) {
      const insertTask = db.prepare(
        'INSERT INTO tasks (id, user_id, title, description, category, generated_by) VALUES (?, ?, ?, ?, ?, ?)'
      );

      for (const task of parsed.tasks.slice(0, 3)) {
        const id = uuidv4();
        insertTask.run(
          id, userId,
          task.title, task.description,
          task.category || 'geral', 'ai'
        );
        newTasks.push({ id, ...task, is_completed: 0, generated_by: 'ai' });
      }
    }

    return NextResponse.json({ tasks: newTasks });
  } catch (err) {
    console.error('Generate steps error:', err);
    return NextResponse.json({ error: 'Failed to generate tasks' }, { status: 500 });
  }
}

function generateFallbackTasks(db, recentMoods, userId) {
  const latestMood = recentMoods?.[0]?.mood || 'neutro';

  const taskSets = {
    ansioso: [
      { title: 'Box Breathing (4-4-4-4)', description: 'Inspire por 4 segundos, segure por 4, expire por 4, segure por 4. Repita 4 vezes. Essa técnica ativa o sistema nervoso parassimpático e reduz a ansiedade.', category: 'respiração' },
      { title: 'Body Scan de 5 minutos', description: 'Deite-se ou sente-se confortavelmente. Lentamente, leve sua atenção dos pés até a cabeça, notando cada sensação sem julgamento.', category: 'autocuidado' },
      { title: 'Liste 3 certezas', description: 'Escreva 3 coisas que você sabe com certeza que são verdade agora. Isso ajuda a ancorar sua mente quando a ansiedade cria cenários imaginários.', category: 'reflexão' },
    ],
    triste: [
      { title: 'Caminhada gentil de 10 min', description: 'Saia para uma caminhada leve, sem pressa. Preste atenção em 5 coisas que você vê, 4 que ouve, 3 que sente.', category: 'exercício' },
      { title: 'Playlist de conforto', description: 'Ouça 3 músicas que te trazem boas memórias. A música pode ativar centros de prazer no cérebro.', category: 'autocuidado' },
      { title: 'Mensagem para alguém querido', description: 'Envie uma mensagem simples para alguém que você gosta (ex: "Lembrei de você ❤️"). Conexão social é um antídoto poderoso para a tristeza.', category: 'social' },
    ],
    feliz: [
      { title: 'Diário de vitórias', description: 'Escreva 3 pequenas conquistas de hoje, mesmo as mais simples. Registrar momentos positivos fortalece a memória feliz.', category: 'reflexão' },
      { title: 'Ato de bondade aleatória', description: 'Faça algo inesperado por outra pessoa hoje: elogio, ajuda, ou uma surpresa. Espalhar alegria multiplica a felicidade.', category: 'social' },
      { title: 'Alongamento energizante', description: '5 minutos de alongamento corporal focando em respiração profunda. Aproveite a boa energia para cuidar do corpo.', category: 'exercício' },
    ],
    default: [
      { title: 'Pausa mindful de 3 min', description: 'Pare o que está fazendo. Feche os olhos. Respire fundo 3 vezes. Observe seus pensamentos como nuvens passando. Isso reseta seu estado mental.', category: 'respiração' },
      { title: 'Copo d\'água + gratidão', description: 'Beba um copo cheio de água e, enquanto bebe, pense em uma coisa pela qual é grato. A hidratação e a gratidão melhoram o humor em conjunto.', category: 'autocuidado' },
      { title: 'Esboce seus sentimentos', description: 'Pegue papel e caneta e desenhe livremente o que está sentindo. Não precisa ser bonito — o ato de externalizar emoções é terapêutico.', category: 'criatividade' },
    ],
  };

  const selectedTasks = taskSets[latestMood] || taskSets.default;

  const insertTask = db.prepare(
    'INSERT INTO tasks (id, user_id, title, description, category, generated_by) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const newTasks = [];
  for (const task of selectedTasks) {
    const id = uuidv4();
    insertTask.run(id, userId, task.title, task.description, task.category, 'ai');
    newTasks.push({ id, ...task, is_completed: 0, generated_by: 'ai' });
  }

  return NextResponse.json({ tasks: newTasks });
}
