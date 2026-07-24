import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getOrCreateUser, getUserByEmail } from '@/src/db/users';
import { signAppToken } from '@/src/lib/auth-jwt';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Nome, e-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve conter no mínimo 6 caracteres.' },
        { status: 400 }
      );
    }

    // Check if user already exists in Cloud SQL
    const existingDbUser = await getUserByEmail(cleanEmail);
    if (existingDbUser) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado. Por favor, faça login.' },
        { status: 400 }
      );
    }

    // Generate unique UID for Cloud SQL
    const uid = `usr_${crypto.randomUUID()}`;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user in Cloud SQL users table
    const dbUser = await getOrCreateUser(
      uid,
      cleanEmail,
      cleanName,
      hashedPassword
    );

    // Generate JWT token
    const token = signAppToken({ uid: dbUser.uid || uid, email: cleanEmail, name: cleanName });

    return NextResponse.json({
      success: true,
      token,
      user: {
        uid: dbUser.uid || uid,
        email: cleanEmail,
        displayName: cleanName,
        dbId: dbUser.id,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao realizar o cadastro.' },
      { status: 500 }
    );
  }
}
