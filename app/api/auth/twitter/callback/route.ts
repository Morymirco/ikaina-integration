import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForToken, getTwitterUser } from '@/lib/twitter-oauth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Logs des paramètres reçus dans l'URL
    console.log('=== CALLBACK OAUTH - Paramètres reçus ===');
    console.log('URL complète:', request.url);
    console.log('Code reçu:', code);
    console.log('State reçu:', state);
    console.log('Error reçu:', error);
    console.log('Tous les paramètres:', Object.fromEntries(searchParams.entries()));

    // Vérifier s'il y a une erreur
    if (error) {
      console.log('❌ Erreur détectée dans les paramètres:', error);
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    // Vérifier que le code et state sont présents
    if (!code || !state) {
      console.log('❌ Code ou state manquant - Code:', code, 'State:', state);
      return NextResponse.redirect(
        new URL('/?error=missing_code_or_state', request.url)
      );
    }

    const cookieStore = await cookies();
    const storedState = cookieStore.get('twitter_state')?.value;
    const codeVerifier = cookieStore.get('twitter_code_verifier')?.value;

    // Logs des valeurs stockées dans les cookies
    console.log('=== CALLBACK OAUTH - Valeurs des cookies ===');
    console.log('Code Verifier stocké:', codeVerifier);
    console.log('State stocké:', storedState);
    console.log('State reçu vs stocké:', { reçu: state, stocké: storedState, match: storedState === state });

    // Vérifier le state pour éviter les attaques CSRF
    if (!storedState || storedState !== state) {
      console.log('❌ State invalide - Attaque CSRF possible');
      return NextResponse.redirect(
        new URL('/?error=invalid_state', request.url)
      );
    }

    if (!codeVerifier) {
      console.log('❌ Code Verifier manquant dans les cookies');
      return NextResponse.redirect(
        new URL('/?error=missing_code_verifier', request.url)
      );
    }

    console.log('✅ Validations réussies - Prêt pour l\'échange du code');

    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    const redirectUri = process.env.TWITTER_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.redirect(
        new URL('/?error=oauth_config_missing', request.url)
      );
    }

    // Échanger le code contre un access token
    console.log('=== CALLBACK OAUTH - Échange du code ===');
    console.log('Code à échanger:', code);
    console.log('Code Verifier utilisé:', codeVerifier);
    console.log('Client ID:', clientId);
    console.log('Redirect URI:', redirectUri);
    
    const tokenData = await exchangeCodeForToken(
      code,
      codeVerifier,
      clientId,
      clientSecret,
      redirectUri
    );

    console.log('✅ Token reçu avec succès');
    console.log('Token Data:', {
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      access_token: tokenData.access_token ? `${tokenData.access_token.substring(0, 20)}...` : 'non disponible',
      refresh_token: tokenData.refresh_token ? `${tokenData.refresh_token.substring(0, 20)}...` : 'non disponible',
      scope: tokenData.scope
    });

    // Récupérer les informations de l'utilisateur
    console.log('=== CALLBACK OAUTH - Récupération utilisateur ===');
    const user = await getTwitterUser(tokenData.access_token);
    console.log('✅ Utilisateur récupéré:', {
      id: user.id,
      username: user.username,
      name: user.name,
      profile_image_url: user.profile_image_url
    });

    // Stocker le token dans un cookie (en production, utilisez une session sécurisée ou JWT)
    console.log('=== CALLBACK OAUTH - Stockage des cookies ===');
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

    console.log('=== CALLBACK OAUTH - Succès complet ===');
    console.log('✅ Redirection vers /dashboard');

    // Rediriger vers le dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('=== CALLBACK OAUTH - ERREUR ===');
    console.error('Type d\'erreur:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Message:', error instanceof Error ? error.message : String(error));
    console.error('Stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('Erreur complète:', error);
    return NextResponse.redirect(
      new URL(
        `/?error=${encodeURIComponent('Erreur lors de la connexion')}`,
        request.url
      )
    );
  }
}
