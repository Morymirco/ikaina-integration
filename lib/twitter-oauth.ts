import crypto from 'crypto';

/**
 * Génère un code verifier et un code challenge pour PKCE
 */
export function generatePKCE() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  
  return {
    codeVerifier,
    codeChallenge,
  };
}

/**
 * Génère l'URL d'autorisation Twitter OAuth 2.0
 */
export function getTwitterAuthUrl(
  clientId: string,
  redirectUri: string,
  codeChallenge: string,
  state?: string
): string {
  // Scopes nécessaires pour toutes les fonctionnalités
  const scope = 'tweet.read tweet.write users.read dm.read dm.write offline.access';
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scope,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state || crypto.randomBytes(16).toString('hex'),
  });

  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
}

/**
 * Échange le code d'autorisation contre un access token
 */
export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
) {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur lors de l'échange du token: ${error}`);
  }

  return await response.json();
}

/**
 * Crée un nouveau tweet
 */
export async function createTweet(accessToken: string, text: string, replyToTweetId?: string) {
  const body: any = {
    text: text,
  };

  // Si c'est une réponse à un tweet
  if (replyToTweetId) {
    body.reply = {
      in_reply_to_tweet_id: replyToTweetId,
    };
  }

  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur lors de la création du tweet: ${error}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Envoie un message privé (DM) à un utilisateur
 */
export async function sendDirectMessage(
  accessToken: string,
  recipientId: string,
  text: string
) {
  // Étape 1: Créer un événement de message
  const eventBody = {
    event: {
      type: 'message_create',
      message_create: {
        target: {
          recipient_id: recipientId,
        },
        message_data: {
          text: text,
        },
      },
    },
  };

  const response = await fetch('https://api.twitter.com/1.1/direct_messages/events/new.json', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur lors de l'envoi du message privé: ${error}`);
  }

  const data = await response.json();
  return data.event;
}

/**
 * Récupère les informations d'un utilisateur par son username
 */
export async function getUserByUsername(accessToken: string, username: string) {
  const response = await fetch(
    `https://api.twitter.com/2/users/by/username/${username}?user.fields=profile_image_url,username,name`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur lors de la récupération de l'utilisateur: ${error}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Récupère un tweet par son ID
 */
export async function getTweetById(accessToken: string, tweetId: string) {
  const response = await fetch(
    `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=created_at,author_id,public_metrics,conversation_id&expansions=author_id&user.fields=username,name`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur lors de la récupération du tweet: ${error}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Récupère les réponses à un tweet
 */
export async function getTweetReplies(accessToken: string, tweetId: string) {
  const response = await fetch(
    `https://api.twitter.com/2/tweets/search/recent?query=conversation_id:${tweetId}&tweet.fields=created_at,author_id,public_metrics,in_reply_to_user_id&expansions=author_id&user.fields=username,name&max_results=10`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur lors de la récupération des réponses: ${error}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Récupère les informations de l'utilisateur connecté
 */
export async function getTwitterUser(accessToken: string) {
  const response = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur lors de la récupération de l'utilisateur: ${error}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Rafraîchit le access token avec le refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
) {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      client_id: clientId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur lors du rafraîchissement du token: ${error}`);
  }

  return await response.json();
}
