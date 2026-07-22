import { NextRequest, NextResponse } from 'next/server';
import { verifyAnyAuthToken } from '@/src/lib/auth-jwt';
import { db } from '@/src/db';
import { users, watches } from '@/src/db/schema';
import { desc } from 'drizzle-orm';

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

    if (table === 'users') {
      const allUsers = await db.select({
        id: users.id,
        uid: users.uid,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      }).from(users).orderBy(desc(users.id));
      
      return NextResponse.json({ table: 'users', count: allUsers.length, data: allUsers });
    }

    if (table === 'watches') {
      const allWatches = await db.select().from(watches).orderBy(desc(watches.createdAt));
      return NextResponse.json({ table: 'watches', count: allWatches.length, data: allWatches });
    }

    // Default 'all': return summary + sample records
    const allUsers = await db.select({
      id: users.id,
      uid: users.uid,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.id));

    const allWatches = await db.select().from(watches).orderBy(desc(watches.createdAt));

    return NextResponse.json({
      summary: {
        totalUsers: allUsers.length,
        totalWatches: allWatches.length,
        databaseType: 'Cloud SQL (PostgreSQL)',
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
