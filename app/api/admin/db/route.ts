import { NextRequest, NextResponse } from 'next/server';
import { verifyAnyAuthToken } from '@/src/lib/auth-jwt';
import { db } from '@/src/db';
import { users, watches } from '@/src/db/schema';
import { desc } from 'drizzle-orm';
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
    let connectedVia = 'Drizzle ORM';

    if (supabaseClient) {
      try {
        const { data: suData } = await supabaseClient.from('users').select('id, uid, name, email, created_at').order('id', { ascending: false });
        const { data: swData } = await supabaseClient.from('watches').select('*').order('created_at', { ascending: false });
        if (suData) allUsers = suData;
        if (swData) allWatches = swData;
        connectedVia = 'Supabase REST API Client';
      } catch (sbErr) {
        console.error('Admin DB fetch via Supabase error:', sbErr);
      }
    }

    if (allUsers.length === 0 && allWatches.length === 0) {
      try {
        allUsers = await db.select({
          id: users.id,
          uid: users.uid,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
        }).from(users).orderBy(desc(users.id));

        allWatches = await db.select().from(watches).orderBy(desc(watches.createdAt));
      } catch (drizzleErr) {
        console.error('Admin DB fetch via Drizzle error:', drizzleErr);
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
        databaseType: 'Supabase (PostgreSQL)',
        connectionType: connectedVia,
        status: 'Connected',
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

