import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'パスワードは必須です' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'パスワードは6文字以上にしてください' },
        { status: 400 }
      );
    }

    // パスワードをハッシュ化
    const passwordHash = await bcrypt.hash(password, 10);

    return NextResponse.json({ password_hash: passwordHash });
  } catch (error: any) {
    console.error('Password hash error:', error);
    return NextResponse.json(
      { error: 'パスワードのハッシュ化に失敗しました' },
      { status: 500 }
    );
  }
}

