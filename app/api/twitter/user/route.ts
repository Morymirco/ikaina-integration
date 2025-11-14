import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserByUsername } from '@/lib/twitter-oauth';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('twitter_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Non authentifié. Veuillez vous connecter.' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Le paramètre username est requis' },
        { status: 400 }
      );
    }

    const user = await getUserByUsername(accessToken, username);

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la récupération de l\'utilisateur',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
