import { getSupabaseClient } from '../lib/supabase';

export interface DbUser {
  id: number;
  uid: string;
  email: string;
  name?: string | null;
  password?: string | null;
  createdAt?: string;
}

export async function getOrCreateUser(
  uid: string,
  email: string,
  name?: string,
  password?: string
): Promise<DbUser> {
  const cleanEmail = email.toLowerCase().trim();
  const supabaseClient = getSupabaseClient();

  if (supabaseClient) {
    try {
      const { data: existingUser } = await supabaseClient
        .from('users')
        .select('*')
        .or(`uid.eq.${uid},email.eq.${cleanEmail}`)
        .maybeSingle();

      if (existingUser) {
        let updatedName = existingUser.name;
        let updatedPassword = existingUser.password;
        let needsUpdate = false;

        if (name && name !== existingUser.name) {
          updatedName = name;
          needsUpdate = true;
        }
        if (password && password !== existingUser.password) {
          updatedPassword = password;
          needsUpdate = true;
        }

        if (needsUpdate) {
          const { data: updated } = await supabaseClient
            .from('users')
            .update({
              name: updatedName,
              password: updatedPassword,
            })
            .eq('id', existingUser.id)
            .select()
            .maybeSingle();

          if (updated) {
            return {
              id: updated.id,
              uid: updated.uid,
              email: updated.email,
              name: updated.name,
              password: updated.password,
              createdAt: updated.created_at || updated.createdAt,
            };
          }
        }

        return {
          id: existingUser.id,
          uid: existingUser.uid,
          email: existingUser.email,
          name: existingUser.name,
          password: existingUser.password,
          createdAt: existingUser.created_at || existingUser.createdAt,
        };
      }

      // Create new user in Supabase
      const { data: newUser, error: insertError } = await supabaseClient
        .from('users')
        .upsert(
          {
            uid,
            email: cleanEmail,
            name: name || cleanEmail.split('@')[0],
            password: password || null,
          },
          { onConflict: 'email' }
        )
        .select()
        .maybeSingle();

      if (!insertError && newUser) {
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
      console.error('Error in getOrCreateUser via Supabase:', err);
    }
  }

  // Fallback for local session when Supabase is not connected
  return {
    id: 1,
    uid,
    email: cleanEmail,
    name: name || cleanEmail.split('@')[0],
    createdAt: new Date().toISOString(),
  };
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const cleanEmail = email.toLowerCase().trim();
  const supabaseClient = getSupabaseClient();

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!error && data) {
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

export async function getUserByUid(uid: string): Promise<DbUser | null> {
  const supabaseClient = getSupabaseClient();

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('uid', uid)
        .maybeSingle();

      if (!error && data) {
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

export async function updateUserPasswordByEmail(email: string, passwordHash: string): Promise<boolean> {
  const cleanEmail = email.toLowerCase().trim();
  const supabaseClient = getSupabaseClient();

  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('users')
        .update({ password: passwordHash })
        .eq('email', cleanEmail);

      if (!error) return true;
    } catch (err) {
      console.error('Error in updateUserPasswordByEmail via Supabase:', err);
    }
  }

  return false;
}
