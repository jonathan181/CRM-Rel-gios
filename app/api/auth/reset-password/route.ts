import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail, updateUserPasswordByEmail } from '@/src/db/users';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'E-mail e nova senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'A nova senha deve ter no mínimo 6 caracteres.' },
        { status: 400 }
      );
    }

    const existingUser = await getUserByEmail(cleanEmail);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Nenhum usuário cadastrado com este e-mail.' },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updateUserPasswordByEmail(cleanEmail, hashedPassword);

    return NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso! Você já pode entrar com sua nova senha.',
    });
  } catch (error: any) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao redefinir a senha.' },
      { status: 500 }
    );
  }
}
