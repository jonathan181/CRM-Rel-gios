import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail } from '@/src/db/users';
import { signAppToken } from '@/src/lib/auth-jwt';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Fetch user from Cloud SQL
    const dbUser = await getUserByEmail(cleanEmail);

    if (!dbUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado. Verifique seu e-mail ou crie uma conta.' },
        { status: 404 }
      );
    }

    // 2. Validate password
    let isPasswordValid = false;
    if (dbUser.password) {
      if (
        dbUser.password.startsWith('$2a$') ||
        dbUser.password.startsWith('$2b$') ||
        dbUser.password.startsWith('$2y$')
      ) {
        isPasswordValid = await bcrypt.compare(password, dbUser.password);
      } else {
        isPasswordValid = password === dbUser.password;
      }
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Senha incorreta. Tente novamente.' },
        { status: 401 }
      );
    }

    // 3. Generate JWT Token
    const token = signAppToken({
      uid: dbUser.uid,
      email: dbUser.email,
      name: dbUser.name || '',
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        uid: dbUser.uid,
        email: dbUser.email,
        displayName: dbUser.name || '',
        dbId: dbUser.id,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao realizar login.' },
      { status: 500 }
    );
  }
}
