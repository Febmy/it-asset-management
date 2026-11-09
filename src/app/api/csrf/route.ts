import { NextResponse } from 'next/server';
import { generateCsrfToken, setCsrfCookie } from '@/lib/csrf';

export async function GET() {
  try {
    const token = await generateCsrfToken();
    const response = NextResponse.json({ success: true, csrfToken: token });
    setCsrfCookie(response, token);
    return response;
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}