import { sql, uuidv4 } from '@/lib/db';
import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// POST /api/chat — send message and stream response
export async function POST(request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, session_id = 'default' } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Save user message
    const msgId = uuidv4();
    await sql`
      INSERT INTO messages (id, user_id, role, content, session_id) 
      VALUES (${msgId}, ${userId}, 'user', ${message}, ${session_id})
    `;

    // Get recent messages for context
    const { rows: recentMessages } = await sql`
      SELECT role, content FROM messages 
      WHERE user_id = ${userId} AND session_id = ${session_id} 
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    recentMessages.reverse();

    // Build dynamic system prompt
    let systemPrompt = `Você é TUPI-2P, uma inteligência artificial atuando estritamente como um psicólogo acolhedor e profundo. Seu grande objetivo nesta conversa é INCENTIVAR O DESABAFO.

DIRETRIZES DE COMPORTAMENTO E ALTA GRAMÁTICA:
- Fale português brasileiro IMPECÁVEL, ortograficamente correto e sem erros de digitação. NUNCA gere palavras inexistentes (ex: inventar plurais absurdos ou errar conjugação). Releia internamente antes de gerar.
- FOQUE APENAS EM OUVIR E VALIDAR. NÃO dê lição de moral, NÃO tente resolver o problema rapidamente.
- Espelhe o sentimento do usuário usando palavras reconfortantes e corretas.
- Aja como um terapeuta paciente. O foco é fazer o usuário falar.
- SEMPRE termine com apenas UMA pergunta aberta clara e de fácil entendimento.
- NUNCA liste passos ou use bullet points. Fale em formato de texto contínuo perfeitamente redigido.
- Respostas curtas: 2 a 4 frases concisas para manter o desabafo no centro da conversa.
- NENHUM EMOJI. ZERO EMOJIS.`;

    // If no API key, use a helpful fallback
    if (!GROQ_API_KEY) {
      return createFallbackStream(message, session_id, userId);
    }

    // Call Groq API with streaming
    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: groqMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!groqResponse.ok) {
      console.error('Groq API error:', groqResponse.status);
      return createFallbackStream(message, session_id, userId);
    }

    // Stream the response
    const encoder = new TextEncoder();
    let fullContent = '';
    let fullThinking = '';

    const stream = new ReadableStream({
      async start(controller) {
        const reader = groqResponse.body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                  const data = JSON.parse(line.slice(6));
                  const delta = data.choices?.[0]?.delta;

                  if (delta?.content) {
                    fullContent += delta.content;
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'content', content: delta.content })}\n\n`)
                    );
                  }
                } catch (e) {
                  // Skip parse errors
                }
              }
            }
          }

          // Save AI response to database
          const aiMsgId = uuidv4();
          await sql`
            INSERT INTO messages (id, user_id, role, content, thinking, session_id) 
            VALUES (${aiMsgId}, ${userId}, 'ai', ${fullContent}, ${fullThinking || null}, ${session_id})
          `;

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
          );
          controller.close();
        } catch (err) {
          console.error('Stream error:', err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', content: 'Erro no streaming da resposta.' })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Fallback when no API key is configured
function createFallbackStream(message, session_id, userId) {
  const encoder = new TextEncoder();

  const responses = [
    'Obrigado por compartilhar. Colocar em palavras o que sentimos já é um passo importante. O que mais você gostaria de explorar sobre isso?',
    'Entendo. Me conta um pouco mais — o que te trouxe até aqui hoje?',
    'Fico feliz que esteja aqui. O que está na sua mente neste momento?',
    'Estou aqui para ouvir. Pode desabafar.',
    'Isso parece difícil. Como você tem se sentido lidando com isso?',
  ];

  const thinking = 'Focando na escuta ativa e validação emocional para apoiar o relato do usuário.';
  const selectedResponse = responses[Math.floor(Math.random() * responses.length)];

  const stream = new ReadableStream({
    async start(controller) {
      // Simulate thinking
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'thinking', content: thinking })}\n\n`)
      );

      // Simulate streaming word by word
      const words = selectedResponse.split(' ');
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 40));
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'content', content: (i > 0 ? ' ' : '') + words[i] })}\n\n`)
        );
      }

      // Save to DB
      try {
        const aiMsgId = uuidv4();
        await sql`
          INSERT INTO messages (id, user_id, role, content, thinking, session_id) 
          VALUES (${aiMsgId}, ${userId}, 'ai', ${selectedResponse}, ${thinking}, ${session_id})
        `;
      } catch (e) {
        console.error('DB save error:', e);
      }

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
