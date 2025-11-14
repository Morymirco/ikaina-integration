import { NextRequest, NextResponse } from 'next/server';
import { generatePKCE, getTwitterAuthUrl } from '@/lib/twitter-oauth';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const redirectUri = process.env.TWITTER_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: 'Configuration OAuth manquante' },
        { status: 500 }
      );
    }

    // Générer PKCE
    const { codeVerifier, codeChallenge } = generatePKCE();
    const state = crypto.randomBytes(16).toString('hex');

    // Stocker le code_verifier et state dans les cookies (sécurisé, httpOnly)
    const cookieStore = await cookies();
    cookieStore.set('twitter_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    });

    cookieStore.set('twitter_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    });

    // Générer l'URL d'autorisation
    const authUrl = getTwitterAuthUrl(clientId, redirectUri, codeChallenge, state);

    // Rediriger vers Twitter
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation OAuth:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'initialisation de la connexion' },
      { status: 500 }
    );
  }
}
