import { db } from './index';
import { users } from './schema';
import { eq, or } from 'drizzle-orm';
import { getSupabaseClient } from '../lib/supabase';

export async function getOrCreateUser(uid: string, email: string, name?: string, password?: string) {
  const cleanEmail = email.toLowerCase().trim();

  // 1. Primary: Drizzle / PostgreSQL pool
  try {
    const existing = await db.select().from(users).where(or(eq(users.uid, uid), eq(users.email, cleanEmail)));
    if (existing && existing.length > 0) {
      const userObj = existing[0];
      if ((name && userObj.name !== name) || (password && userObj.password !== password)) {
        const updated = await db
          .update(users)
          .set({
            ...(name ? { name } : {}),
            ...(password ? { password } : {}),
          })
          .where(eq(users.id, userObj.id))
          .returning();
        if (updated[0]) return updated[0];
      }
      return userObj;
    }

    const result = await db
      .insert(users)
      .values({
        uid,
        email: cleanEmail,
        name: name || null,
        password: password || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: cleanEmail,
          ...(name ? { name } : {}),
          ...(password ? { password } : {}),
        },
      })
      .returning();

    if (result[0]) return result[0];
  } catch (error) {
    console.error('Drizzle getOrCreateUser error:', error);
  }

  // 2. Secondary/Fallback: Supabase client
  const supabaseClient = getSupabaseClient();
  if (supabaseClient) {
    try {
      const { data: existingUser } = await supabaseClient
        .from('users')
        .select('*')
        .or(`uid.eq.${uid},email.eq.${cleanEmail}`)
        .maybeSingle();

      if (existingUser) {
        return {
          id: existingUser.id,
          uid: existingUser.uid,
          email: existingUser.email,
          name: existingUser.name,
          password: existingUser.password,
          createdAt: existingUser.created_at || existingUser.createdAt,
        };
      }

      const { data: newUser } = await supabaseClient
        .from('users')
        .upsert(
          {
            uid,
            email: cleanEmail,
            name: name || null,
            password: password || null,
          },
          { onConflict: 'email' }
        )
        .select()
        .maybeSingle();

      if (newUser) {
        return {
          id: newUser.id,
          uid: newUser.uid,
          email: newUser.email,
          name: newUser.name,
          password: newUser.password,
          createdAt: newUser.created_at || newUser.createdAt,
        };
      }
    } catch (err) {
      console.warn('Error executing Supabase user operation:', err);
    }
  }

  return {
    id: 1,
    uid,
    email: cleanEmail,
    name: name || cleanEmail.split('@')[0],
    createdAt: new Date().toISOString(),
  };
}

export async function getUserByEmail(email: string) {
  const cleanEmail = email.toLowerCase().trim();

  try {
    const result = await db.select().from(users).where(eq(users.email, cleanEmail));
    if (result && result.length > 0) return result[0];
  } catch (error) {
    console.error('Error in getUserByEmail via Drizzle:', error);
  }

  const supabaseClient = getSupabaseClient();
  if (supabaseClient) {
    try {
      const { data } = await supabaseClient
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (data) {
        return {
          id: data.id,
          uid: data.uid,
          email: data.email,
          name: data.name,
          password: data.password,
          createdAt: data.created_at || data.createdAt,
        };
      }
    } catch (err) {
      console.error('Error in getUserByEmail via Supabase:', err);
    }
  }

  return null;
}

export async function getUserByUid(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid));
    if (result && result.length > 0) return result[0];
  } catch (error) {
    console.error('Error in getUserByUid via Drizzle:', error);
  }

  const supabaseClient = getSupabaseClient();
  if (supabaseClient) {
    try {
      const { data } = await supabaseClient
        .from('users')
        .select('*')
        .eq('uid', uid)
        .maybeSingle();

      if (data) {
        return {
          id: data.id,
          uid: data.uid,
          email: data.email,
          name: data.name,
          password: data.password,
          createdAt: data.created_at || data.createdAt,
        };
      }
    } catch (err) {
      console.error('Error in getUserByUid via Supabase:', err);
    }
  }

  return null;
}



