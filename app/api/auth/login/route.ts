import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email?.endsWith('@brasporto.com')) {
    return NextResponse.json({ error: 'Apenas emails @brasporto.com são permitidos' }, { status: 403 });
  }

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    const msg: Record<string, string> = {
      'EMAIL_NOT_FOUND': 'Email não encontrado',
      'INVALID_PASSWORD': 'Senha incorreta',
      'INVALID_LOGIN_CREDENTIALS': 'Email ou senha incorretos',
      'USER_DISABLED': 'Conta desativada',
      'TOO_MANY_ATTEMPTS_TRY_LATER': 'Muitas tentativas. Tente mais tarde',
    };
    const code: string = data.error?.message ?? 'UNKNOWN';
    return NextResponse.json({ error: msg[code] ?? 'Credenciais inválidas' }, { status: 401 });
  }

  const response = NextResponse.json({ email: data.email });
  response.cookies.set('session', data.idToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  return response;
}
