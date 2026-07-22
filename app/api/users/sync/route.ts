import { NextRequest, NextResponse } from 'next/server';
import { verifyAnyAuthToken } from '@/src/lib/auth-jwt';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const authUser = await verifyAnyAuthToken(token);

    if (!authUser) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: authUser.dbUser });
  } catch (error: any) {
    console.error('Error syncing user:', error);
    return NextResponse.json({ error: error.message || 'Erro ao sincronizar usuário no banco' }, { status: 500 });
  }
}
