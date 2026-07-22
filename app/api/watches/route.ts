import { NextRequest, NextResponse } from 'next/server';
import { verifyAnyAuthToken } from '@/src/lib/auth-jwt';
import { getWatchesFromDb, upsertWatchInDb, deleteWatchFromDb, replaceAllWatchesInDb } from '@/src/db/watches';

async function authenticateRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split('Bearer ')[1];
  return await verifyAnyAuthToken(token);
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await authenticateRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado. Faça login primeiro.' }, { status: 401 });
    }
    const watches = await getWatchesFromDb(authUser.uid);
    return NextResponse.json({ watches });
  } catch (error: any) {
    console.error('GET /api/watches error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao buscar relógios' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await authenticateRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado. Faça login primeiro.' }, { status: 401 });
    }
    const body = await req.json();

    if (body.action === 'replace_all' && Array.isArray(body.watches)) {
      const updated = await replaceAllWatchesInDb(body.watches, authUser.uid, authUser.dbUser.id);
      return NextResponse.json({ watches: updated });
    }

    if (body.watch) {
      const saved = await upsertWatchInDb(body.watch, authUser.uid, authUser.dbUser.id);
      return NextResponse.json({ watch: saved });
    }

    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/watches error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao salvar no banco de dados' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await authenticateRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado. Faça login primeiro.' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID do relógio é obrigatório' }, { status: 400 });
    }
    await deleteWatchFromDb(id, authUser.uid);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/watches error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao deletar relógio' }, { status: 500 });
  }
}
