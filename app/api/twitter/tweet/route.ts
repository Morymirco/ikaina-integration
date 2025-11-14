import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createTweet } from '@/lib/twitter-oauth';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('twitter_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Non authentifié. Veuillez vous connecter.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { text, replyToTweetId } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le texte du tweet est requis' },
        { status: 400 }
      );
    }

    if (text.length > 280) {
      return NextResponse.json(
        { error: 'Le tweet ne peut pas dépasser 280 caractères' },
        { status: 400 }
      );
    }

    const tweet = await createTweet(accessToken, text, replyToTweetId);

    return NextResponse.json({ success: true, tweet });
  } catch (error) {
    console.error('Erreur lors de la création du tweet:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la création du tweet',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
