import { NextRequest, NextResponse } from 'next/server';
import { verifyAnyAuthToken } from '@/src/lib/auth-jwt';
import { getSupabaseClient } from '@/src/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado. Token de autenticação necessário.' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const authUser = await verifyAnyAuthToken(token);

    if (!authUser) {
      return NextResponse.json({ error: 'Sessão inválida. Faça login primeiro.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const table = searchParams.get('table') || 'all';
    const supabaseClient = getSupabaseClient();

    let allUsers: any[] = [];
    let allWatches: any[] = [];

    if (supabaseClient) {
      try {
        const { data: suData } = await supabaseClient.from('users').select('id, uid, name, email, created_at').order('id', { ascending: false });
        const { data: swData } = await supabaseClient.from('watches').select('*').order('created_at', { ascending: false });
        if (suData) allUsers = suData;
        if (swData) allWatches = swData;
      } catch (sbErr) {
        console.error('Admin DB fetch via Supabase error:', sbErr);
      }
    }

    if (table === 'users') {
      return NextResponse.json({ table: 'users', count: allUsers.length, data: allUsers });
    }

    if (table === 'watches') {
      return NextResponse.json({ table: 'watches', count: allWatches.length, data: allWatches });
    }

    return NextResponse.json({
      summary: {
        totalUsers: allUsers.length,
        totalWatches: allWatches.length,
        databaseType: 'Supabase (PostgreSQL REST API)',
        connectionType: supabaseClient ? 'Supabase Client Connected' : 'Disconnected (Missing Supabase Credentials)',
        status: supabaseClient ? 'Connected' : 'Offline',
      },
      tables: {
        users: allUsers,
        watches: allWatches,
      },
    });
  } catch (error: any) {
    console.error('API /api/admin/db error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao consultar banco de dados.' }, { status: 500 });
  }
}
