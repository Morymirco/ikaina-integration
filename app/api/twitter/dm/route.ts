import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sendDirectMessage, getUserByUsername } from '@/lib/twitter-oauth';

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
    const { recipientUsername, recipientId, text } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le message est requis' },
        { status: 400 }
      );
    }

    let userId = recipientId;

    // Si on a un username mais pas d'ID, récupérer l'ID
    if (!userId && recipientUsername) {
      const user = await getUserByUsername(accessToken, recipientUsername);
      userId = user.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'ID ou username du destinataire requis' },
        { status: 400 }
      );
    }

    const dm = await sendDirectMessage(accessToken, userId, text);

    return NextResponse.json({ success: true, message: dm });
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message privé:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de l\'envoi du message privé',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
