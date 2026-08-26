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
  const url = res.url || '';

  let text = '';
  try {
    text = await res.text();
  } catch (readErr: any) {
    throw new ApiError('Não foi possível ler a resposta do servidor.', {
      status: res.status,
      statusText: res.statusText,
      url,
      bodyText: readErr?.message || '',
    });
  }

  // Try to parse as JSON first regardless of exact Content-Type header
  let data: any = null;
  let isJson = false;
  try {
    data = JSON.parse(text);
    isJson = true;
  } catch {
    isJson = false;
  }

  if (isJson) {
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

  // If response is not JSON (e.g. HTML error page 500/404 or SPA fallback)
  let userFriendlyMsg = `O servidor retornou uma resposta não-JSON (${res.status} ${res.statusText || ''}).`.trim();

  if (text.startsWith('<!DOCTYPE') || text.includes('<html') || text.includes('<!doctype')) {
    if (res.status === 500) {
      userFriendlyMsg = `Erro 500 no Servidor. Verifique se as variáveis de ambiente (como DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY ou JWT_SECRET) foram cadastradas.`;
    } else if (res.status === 404) {
      userFriendlyMsg = `Rota da API não encontrada (${url || res.status}).`;
    } else if (res.status === 200) {
      userFriendlyMsg = `A rota da API retornou uma página HTML em vez de JSON.`;
    } else {
      userFriendlyMsg = `O servidor retornou uma página HTML (${res.status}) em vez de JSON.`;
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

