export async function safeFetchJson<T = any>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  
  if (contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      throw new Error('Falha ao interpretar a resposta do servidor como JSON.');
    }
  }

  // If response is not JSON (e.g. HTML error page 500 or 404 from Vercel)
  const text = await res.text();
  if (text.startsWith('<!DOCTYPE') || text.includes('<html') || text.includes('<!doctype')) {
    if (res.status === 500) {
      throw new Error(
        `Erro 500 no Servidor Vercel. Verifique se as variáveis de ambiente (como DATABASE_URL, POSTGRES_URL ou JWT_SECRET) foram cadastradas no painel da Vercel.`
      );
    }
    if (res.status === 404) {
      throw new Error(`Rota da API não encontrada (Erro 404 na Vercel).`);
    }
    throw new Error(`O servidor retornou uma página HTML (${res.status}) em vez de JSON. Verifique a conexão com o banco de dados e as variáveis na Vercel.`);
  }

  throw new Error(`Resposta do servidor inválida (${res.status}): ${text.substring(0, 100)}`);
}
