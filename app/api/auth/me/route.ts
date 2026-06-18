import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;

export async function GET(req: NextRequest) {
  const token = req.cookies.get('session')?.value;
  if (!token) return NextResponse.json({ user: null });

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    }
  );

  if (!res.ok) return NextResponse.json({ user: null });

  const data = await res.json();
  const userEmail: string = data.users?.[0]?.email ?? '';

  if (!userEmail.endsWith('@brasporto.com')) return NextResponse.json({ user: null });

  return NextResponse.json({ user: { email: userEmail } });
}
