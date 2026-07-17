import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@klipai/db/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email: rawEmail, password } = body;
    const email = typeof rawEmail === 'string' ? rawEmail.toLowerCase().trim() : rawEmail;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password minimal 8 karakter' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        credits: 30,
        subscription: 'FREE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        credits: true,
        subscription: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { user, message: 'Registrasi berhasil' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}