export class ApiError extends Error {
  status: number;
  statusText: string;
  url: string;
  bodyText: string;
  data: any;
  timestamp: string;

  constructor(
    message: string,
    options: {
      status: number;
      statusText?: string;
      url?: string;
      bodyText?: string;
      data?: any;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.statusText = options.statusText || '';
    this.url = options.url || '';
    this.bodyText = options.bodyText || '';
    this.data = options.data || null;
    this.timestamp = new Date().toLocaleString('pt-BR');
  }
}

export async function safeFetchJson<T = any>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  const url = res.url || '';

  if (contentType.includes('application/json')) {
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      throw new ApiError('Falha ao interpretar a resposta do servidor como JSON.', {
        status: res.status,
        statusText: res.statusText,
        url,
        bodyText: 'Erro ao converter JSON do servidor',
      });
    }

    if (!res.ok || (data && data.error)) {
      const errorMsg =
        data?.error ||
        data?.message ||
        `Erro no servidor (${res.status} ${res.statusText || ''})`.trim();
      throw new ApiError(errorMsg, {
        status: res.status,
        statusText: res.statusText,
        url,
        bodyText: JSON.stringify(data, null, 2),
        data,
      });
    }

    return data as T;
  }

  // If response is not JSON (e.g. HTML error page 500 or 404 from Vercel)
  const text = await res.text();
  let userFriendlyMsg = `O servidor Vercel retornou uma resposta (${res.status} ${res.statusText || ''}).`.trim();

  if (text.startsWith('<!DOCTYPE') || text.includes('<html') || text.includes('<!doctype')) {
    if (res.status === 500) {
      userFriendlyMsg = `Erro 500 no Servidor Vercel. Verifique se as variáveis de ambiente (como DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY ou JWT_SECRET) foram cadastradas no painel da Vercel.`;
    } else if (res.status === 404) {
      userFriendlyMsg = `Rota da API não encontrada (Erro 404 na Vercel).`;
    } else {
      userFriendlyMsg = `O servidor Vercel retornou uma página HTML (${res.status}) em vez de JSON. Verifique as variáveis no painel da Vercel.`;
    }
  } else if (text) {
    userFriendlyMsg = `Resposta do servidor (${res.status}): ${text.substring(0, 150)}`;
  }

  throw new ApiError(userFriendlyMsg, {
    status: res.status,
    statusText: res.statusText,
    url,
    bodyText: text.substring(0, 3000),
  });
}

