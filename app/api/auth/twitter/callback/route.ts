import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForToken, getTwitterUser } from '@/lib/twitter-oauth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Vérifier s'il y a une erreur
    if (error) {
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    // Vérifier que le code et state sont présents
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/?error=missing_code_or_state', request.url)
      );
    }

    const cookieStore = await cookies();
    const storedState = cookieStore.get('twitter_state')?.value;
    const codeVerifier = cookieStore.get('twitter_code_verifier')?.value;

    // Vérifier le state pour éviter les attaques CSRF
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL('/?error=invalid_state', request.url)
      );
    }

    if (!codeVerifier) {
      return NextResponse.redirect(
        new URL('/?error=missing_code_verifier', request.url)
      );
    }

    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    const redirectUri = process.env.TWITTER_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.redirect(
        new URL('/?error=oauth_config_missing', request.url)
      );
    }

    // Échanger le code contre un access token
    const tokenData = await exchangeCodeForToken(
      code,
      codeVerifier,
      clientId,
      clientSecret,
      redirectUri
    );

    // Récupérer les informations de l'utilisateur
    const user = await getTwitterUser(tokenData.access_token);

    // Stocker le token dans un cookie (en production, utilisez une session sécurisée ou JWT)
    cookieStore.set('twitter_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in || 7200, // 2 heures par défaut
    });

    if (tokenData.refresh_token) {
      cookieStore.set('twitter_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 90, // 90 jours
      });
    }

    // Stocker les infos utilisateur (pour l'exemple, en production utilisez une session)
    cookieStore.set('twitter_user', JSON.stringify(user), {
      httpOnly: false, // Accessible côté client pour l'affichage
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 heures
    });

    // Nettoyer les cookies temporaires
    cookieStore.delete('twitter_code_verifier');
    cookieStore.delete('twitter_state');

    // Rediriger vers le dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Erreur lors du callback OAuth:', error);
    return NextResponse.redirect(
      new URL(
        `/?error=${encodeURIComponent('Erreur lors de la connexion')}`,
        request.url
      )
    );
  }
}
