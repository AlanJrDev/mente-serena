import './globals.css';

export const metadata = {
  title: 'Mente Serena — Bem-estar Mental',
  description: 'Aplicativo de bem-estar mental com IA. Chat empático, diário emocional, tarefas de autocuidado e dashboard de acompanhamento.',
  keywords: 'saúde mental, bem-estar, diário emocional, mindfulness, IA, LLaMA',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#0B0F1A" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><path d=%2214 8L8 28H20L14 8Z%22 fill=%22%23F9FAFB%22/><path d=%2250 8L44 28H56L50 8Z%22 fill=%22%23F9FAFB%22/><circle cx=%2232%22 cy=%2236%22 r=%2220%22 fill=%22%23F9FAFB%22/><ellipse cx=%2224%22 cy=%2233%22 rx=%223%22 ry=%223.5%22 fill=%22%230B0F1A%22/><ellipse cx=%2240%22 cy=%2233%22 rx=%223%22 ry=%223.5%22 fill=%22%230B0F1A%22/><path d=%2230 39L32 41L34 39%22 stroke=%22%234D6BFE%22 stroke-width=%221.5%22 stroke-linecap=%22round%22 fill=%22none%22/></svg>" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
