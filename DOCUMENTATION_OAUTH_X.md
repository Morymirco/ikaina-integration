# Documentation : Intégration OAuth 2.0 avec X (Twitter)

Cette documentation explique comment intégrer l'authentification OAuth 2.0 avec X (anciennement Twitter) de manière générique, applicable à n'importe quelle plateforme ou framework.

## 📋 Table des matières

1. [Introduction à OAuth 2.0 avec X](#introduction)
2. [Prérequis](#prérequis)
3. [Configuration de l'application Twitter](#configuration)
4. [Flux OAuth 2.0 avec PKCE](#flux-oauth)
5. [Étapes d'implémentation](#étapes-implémentation)
6. [Utilisation de l'API Twitter](#utilisation-api)
7. [Cas d'usage pratiques](#cas-dusage)
8. [Gestion des erreurs](#gestion-erreurs)
9. [Sécurité](#sécurité)

---

## 🔑 Introduction à OAuth 2.0 avec X

OAuth 2.0 est un protocole d'autorisation standard qui permet à une application d'obtenir un accès limité à un compte utilisateur. X (anciennement Twitter) utilise OAuth 2.0 avec PKCE (Proof Key for Code Exchange) pour la sécurité.

### Pourquoi PKCE ?

PKCE est une extension de sécurité d'OAuth 2.0 particulièrement importante pour les applications publiques (comme les applications web) car elle :
- Protège contre les attaques d'interception du code d'autorisation
- Évite de stocker le client secret côté client
- Améliore la sécurité globale du flux OAuth

---

## 📋 Prérequis

### 1. Compte développeur X/Twitter

- Créez un compte sur [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
- Acceptez les conditions d'utilisation
- Remplissez le formulaire de demande d'accès développeur

### 2. Créer une application

1. Accédez au [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Cliquez sur "Create App" ou "New Project"
3. Remplissez les informations de l'application :
   - **App name** : Nom de votre application
   - **Type of App** : Web App, Automated App or Bot
   - **App permissions** : Déterminez les permissions nécessaires

### 3. Obtenir les credentials

Dans les paramètres de votre application, vous obtiendrez :
- **Client ID** : Identifiant public de votre application
- **Client Secret** : Clé secrète (à garder confidentielle)

---

## ⚙️ Configuration de l'application Twitter

### Permissions (Scopes)

Les scopes déterminent ce que votre application peut faire :

| Scope | Description |
|-------|-------------|
| `tweet.read` | Lire les tweets |
| `tweet.write` | Créer et modifier des tweets |
| `users.read` | Lire les informations utilisateur |
| `dm.read` | Lire les messages privés |
| `dm.write` | Envoyer des messages privés |
| `offline.access` | Obtenir un refresh token pour accès permanent |

**Exemple de scope complet :**
```
tweet.read tweet.write users.read dm.read dm.write offline.access
```

### Callback URL

Configurez l'URL de redirection dans votre application X :
- **Callback URI** : `https://votre-domaine.com/api/auth/callback`
- Pour le développement local : `http://localhost:3000/api/auth/callback`

**Important** : L'URL doit correspondre **exactement** à celle utilisée dans votre code.

---

## 🔄 Flux OAuth 2.0 avec PKCE

### Vue d'ensemble du flux

```
┌─────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│ Client  │─────>│    X     │─────>│  User    │─────>│    X     │
│  App    │      │  Auth    │      │ Browser  │      │  Auth    │
└─────────┘      └──────────┘      └──────────┘      └──────────┘
     │                 │                                    │
     │                 │<───────────────────────────────────│
     │                 │                                    │
     │<────────────────│                                    │
     │                 │                                    │
     │                 │───────>│ X API │<─────────────────│
     │                 │        └─────────────┘
     │<────────────────│
```

### Étapes détaillées

#### Étape 1 : Générer PKCE

**Code Verifier** : Chaîne aléatoire de 43 à 128 caractères
```javascript
const codeVerifier = generateRandomString(32); // Base64URL encodé
```

**Code Challenge** : Hash SHA256 du code verifier
```javascript
const codeChallenge = base64url(SHA256(codeVerifier));
```

**Exemple d'implémentation :**
```javascript
function generatePKCE() {
  // Générer un code verifier aléatoire (32 bytes)
  const codeVerifier = randomBytes(32).toString('base64url');
  
  // Calculer le code challenge (SHA256 hash en base64url)
  const codeChallenge = createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  
  return { codeVerifier, codeChallenge };
}
```

#### Étape 2 : Rediriger vers Twitter

Construire l'URL d'autorisation :

```
https://twitter.com/i/oauth2/authorize?
  response_type=code&
  client_id=VOTRE_CLIENT_ID&
  redirect_uri=VOTRE_REDIRECT_URI&
  scope=tweet.read+users.read+offline.access&
  code_challenge=CODE_CHALLENGE&
  code_challenge_method=S256&
  state=STATE_RANDOM
```

**Paramètres :**
- `response_type` : Toujours `code`
- `client_id` : Votre Client ID
- `redirect_uri` : URL de callback (doit correspondre à la config)
- `scope` : Permissions demandées (séparées par des espaces)
- `code_challenge` : Code challenge généré (PKCE)
- `code_challenge_method` : `S256` (SHA256)
- `state` : Chaîne aléatoire pour protection CSRF

**Stockage temporaire :**
- Stocker le `code_verifier` et `state` (cookies, session, etc.)
- Ils seront nécessaires à l'étape suivante

#### Étape 3 : Réception du callback

X redirige vers votre callback URL avec :
```
https://votre-domaine.com/api/auth/callback?
  code=AUTHORIZATION_CODE&
  state=STATE_VALUE
```

**Vérifications :**
1. Vérifier que le `state` correspond à celui stocké (protection CSRF)
2. Vérifier qu'il n'y a pas de paramètre `error`
3. Récupérer le `code` d'autorisation

#### Étape 4 : Échanger le code contre un token

**Endpoint :** `POST https://api.twitter.com/2/oauth2/token`

**Headers :**
```
Content-Type: application/x-www-form-urlencoded
Authorization: Basic BASE64(CLIENT_ID:CLIENT_SECRET)
```

**Body :**
```
code=AUTHORIZATION_CODE&
grant_type=authorization_code&
client_id=CLIENT_ID&
redirect_uri=REDIRECT_URI&
code_verifier=CODE_VERIFIER
```

**Réponse :**
```json
{
  "token_type": "bearer",
  "expires_in": 7200,
  "access_token": "ACCESS_TOKEN",
  "scope": "tweet.read users.read offline.access",
  "refresh_token": "REFRESH_TOKEN"
}
```

**Exemple d'implémentation :**
```javascript
async function exchangeCodeForToken(code, codeVerifier, clientId, clientSecret, redirectUri) {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      code: code,
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Token exchange failed: ${await response.text()}`);
  }
  
  return await response.json();
}
```

#### Étape 5 : Utiliser l'access token

L'access token permet d'appeler l'API Twitter :

```javascript
const response = await fetch('https://api.twitter.com/2/users/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
```

---

## 🔧 Étapes d'implémentation

### 1. Connexion d'un compte Twitter

**Fonction complète :**
```javascript
// 1. Générer PKCE
const { codeVerifier, codeChallenge } = generatePKCE();
const state = generateRandomState();

// 2. Stocker codeVerifier et state (session, cookies, etc.)
storeInSession('code_verifier', codeVerifier);
storeInSession('state', state);

// 3. Construire et rediriger vers l'URL d'autorisation
const authUrl = `https://twitter.com/i/oauth2/authorize?${new URLSearchParams({
  response_type: 'code',
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  scope: 'tweet.read tweet.write users.read offline.access',
  code_challenge: codeChallenge,
  code_challenge_method: 'S256',
  state: state,
}).toString()}`;

redirect(authUrl);
```

**Callback handler :**
```javascript
// 4. Dans le callback handler
const code = request.query.code;
const state = request.query.state;
const storedState = getFromSession('state');
const codeVerifier = getFromSession('code_verifier');

// Vérifier le state
if (state !== storedState) {
  throw new Error('Invalid state parameter');
}

// 5. Échanger le code contre un token
const tokenData = await exchangeCodeForToken(
  code,
  codeVerifier,
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// 6. Stocker le token (de manière sécurisée)
storeToken(tokenData.access_token, tokenData.refresh_token);
```

### 2. Rafraîchir un token expiré

Les access tokens expirent après 2 heures. Utilisez le refresh token :

```javascript
async function refreshAccessToken(refreshToken, clientId, clientSecret) {
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
    throw new Error('Token refresh failed');
  }
  
  const tokenData = await response.json();
  return tokenData;
}
```

---

## 📡 Utilisation de l'API X

### Récupérer les informations utilisateur

**Endpoint :** `GET https://api.twitter.com/2/users/me`

**Headers :**
```
Authorization: Bearer ACCESS_TOKEN
```

**Exemple :**
```javascript
async function getTwitterUser(accessToken) {
  const response = await fetch(
    'https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name',
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to get user info');
  }
  
  const data = await response.json();
  return data.data; // { id, name, username, profile_image_url }
}
```

### Créer un tweet

**Endpoint :** `POST https://api.twitter.com/2/tweets`

**Headers :**
```
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

**Body :**
```json
{
  "text": "Votre message de tweet ici"
}
```

**Exemple :**
```javascript
async function createTweet(accessToken, text) {
  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: text,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create tweet: ${error}`);
  }
  
  const data = await response.json();
  return data.data; // { id, text }
}
```

### Répondre à un tweet

**Endpoint :** `POST https://api.twitter.com/2/tweets`

**Body :**
```json
{
  "text": "Votre réponse",
  "reply": {
    "in_reply_to_tweet_id": "TWEET_ID_TO_REPLY_TO"
  }
}
```

**Exemple :**
```javascript
async function replyToTweet(accessToken, text, replyToTweetId) {
  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: text,
      reply: {
        in_reply_to_tweet_id: replyToTweetId,
      },
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to reply to tweet');
  }
  
  return await response.json();
}
```

### Envoyer un message privé (DM)

**Endpoint :** `POST https://api.twitter.com/1.1/direct_messages/events/new.json`

**Headers :**
```
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

**Body :**
```json
{
  "event": {
    "type": "message_create",
    "message_create": {
      "target": {
        "recipient_id": "USER_ID"
      },
      "message_data": {
        "text": "Votre message privé"
      }
    }
  }
}
```

**Exemple :**
```javascript
async function sendDirectMessage(accessToken, recipientId, text) {
  const response = await fetch(
    'https://api.twitter.com/1.1/direct_messages/events/new.json',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send DM: ${error}`);
  }
  
  return await response.json();
}
```

**Important pour les DMs :**
- L'utilisateur doit suivre le destinataire ou vice versa
- Nécessite les scopes `dm.read` et `dm.write`
- Utilise l'API v1.1 (pas v2)

### Récupérer un utilisateur par username

**Endpoint :** `GET https://api.twitter.com/2/users/by/username/{username}`

```javascript
async function getUserByUsername(accessToken, username) {
  const response = await fetch(
    `https://api.twitter.com/2/users/by/username/${username}?user.fields=profile_image_url,username,name`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to get user');
  }
  
  const data = await response.json();
  return data.data; // { id, name, username, profile_image_url }
}
```

---

## 💼 Cas d'usage pratiques

### Cas d'usage 1 : Système de notification automatique

**Scénario :** Envoyer une notification DM à un utilisateur lors d'un événement.

```javascript
async function sendNotificationDM(accessToken, username, message) {
  // 1. Récupérer l'ID utilisateur depuis le username
  const user = await getUserByUsername(accessToken, username);
  
  // 2. Envoyer le DM
  const dm = await sendDirectMessage(accessToken, user.id, message);
  
  return dm;
}

// Utilisation
await sendNotificationDM(
  accessToken,
  'john_doe',
  'Votre commande a été confirmée!'
);
```

### Cas d'usage 2 : Bot de réponse automatique

**Scénario :** Créer un bot qui répond automatiquement aux mentions.

```javascript
async function replyToMentions(accessToken) {
  // 1. Récupérer les mentions (nécessite d'implémenter getMentions)
  const mentions = await getMentions(accessToken);
  
  // 2. Pour chaque mention, répondre
  for (const mention of mentions) {
    await replyToTweet(
      accessToken,
      'Merci pour votre message! Nous vous répondrons sous peu.',
      mention.id
    );
  }
}
```

### Cas d'usage 3 : Publication programmée

**Scénario :** Publier un tweet à une heure précise.

```javascript
async function scheduleTweet(accessToken, text, scheduledTime) {
  // Note: Twitter API v2 ne supporte pas nativement la programmation
  // Il faut utiliser un scheduler externe (cron job, etc.)
  
  // Implémentation avec un scheduler
  schedule(scheduledTime, async () => {
    await createTweet(accessToken, text);
  });
}
```

---

## ⚠️ Gestion des erreurs

### Erreurs communes

#### 1. `invalid_client`

**Cause :** Client ID ou Client Secret incorrect
**Solution :** Vérifier les credentials dans le dashboard Twitter

#### 2. `invalid_grant`

**Cause :** Code d'autorisation invalide ou expiré
**Solution :** Le code expire après 10 minutes, relancer le flux

#### 3. `redirect_uri_mismatch`

**Cause :** L'URL de callback ne correspond pas à celle configurée
**Solution :** Vérifier l'exacte correspondance dans le dashboard

#### 4. `invalid_request`

**Cause :** Paramètres manquants ou invalides
**Solution :** Vérifier tous les paramètres de la requête

#### 5. `forbidden`

**Cause :** Permissions insuffisantes ou scope manquant
**Solution :** Vérifier les scopes demandés et les permissions de l'app

### Gestion des erreurs dans le code

```javascript
async function handleTwitterAPIError(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: await response.text() }));
    
    switch (response.status) {
      case 401:
        // Token expiré, rafraîchir
        throw new Error('Token expired, refresh required');
      case 403:
        // Permissions insuffisantes
        throw new Error('Insufficient permissions');
      case 429:
        // Rate limit dépassé
        throw new Error('Rate limit exceeded');
      default:
        throw new Error(error.message || 'Unknown error');
    }
  }
}
```

---

## 🔒 Sécurité

### Bonnes pratiques

1. **Ne jamais exposer le Client Secret**
   - Garder le secret côté serveur uniquement
   - Ne jamais l'inclure dans le code client

2. **Stockage sécurisé des tokens**
   - Utiliser des cookies httpOnly pour les tokens
   - Chiffrer les tokens en base de données
   - Utiliser HTTPS en production

3. **Validation du state**
   - Toujours générer un state unique
   - Vérifier le state au callback
   - Protection contre les attaques CSRF

4. **Gestion des tokens**
   - Rafraîchir les tokens avant expiration
   - Supprimer les tokens lors de la déconnexion
   - Implémenter une rotation des refresh tokens

5. **Rate limiting**
   - Respecter les limites de l'API Twitter
   - Implémenter un système de retry avec backoff
   - Gérer les erreurs 429 (Too Many Requests)

### Exemple de stockage sécurisé

```javascript
// Stockage du token avec expiration
function storeTokenSecurely(accessToken, refreshToken, expiresIn) {
  const expiresAt = Date.now() + (expiresIn * 1000);
  
  // Chiffrer avant stockage (exemple simplifié)
  const encryptedToken = encrypt(accessToken);
  
  // Stocker dans une base de données sécurisée
  database.save({
    access_token: encryptedToken,
    refresh_token: encrypt(refreshToken),
    expires_at: expiresAt,
  });
}

// Vérifier et rafraîchir si nécessaire
async function getValidToken(userId) {
  const tokenData = database.get(userId);
  
  if (Date.now() >= tokenData.expires_at) {
    // Token expiré, rafraîchir
    const newTokenData = await refreshAccessToken(
      tokenData.refresh_token,
      CLIENT_ID,
      CLIENT_SECRET
    );
    
    storeTokenSecurely(
      newTokenData.access_token,
      newTokenData.refresh_token,
      newTokenData.expires_in
    );
    
    return decrypt(newTokenData.access_token);
  }
  
  return decrypt(tokenData.access_token);
}
```

---

## 📚 Ressources supplémentaires

- [Documentation officielle X API](https://developer.twitter.com/en/docs/twitter-api)
- [Guide OAuth 2.0 avec PKCE](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [Référence des endpoints API v2](https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference)
- [Référence des endpoints API v1.1](https://developer.twitter.com/en/docs/twitter-api/v1)

---

## ❓ Questions fréquentes

### Q: Puis-je utiliser OAuth 1.0a au lieu d'OAuth 2.0 ?

R: OAuth 1.0a est toujours supporté mais OAuth 2.0 avec PKCE est recommandé pour les nouvelles applications.

### Q: Les tokens expirent-ils ?

R: Oui, les access tokens expirent après 2 heures. Utilisez le refresh token pour obtenir un nouveau token.

### Q: Puis-je envoyer des DMs sans que l'utilisateur me suive ?

R: Non, l'utilisateur doit vous suivre ou vous devez le suivre pour envoyer des DMs.

### Q: Comment obtenir un refresh token ?

R: Demandez le scope `offline.access` lors de l'autorisation initiale.

### Q: Y a-t-il des limites de taux ?

R: Oui, X applique des limites de taux selon le type d'endpoint. Consultez la documentation pour les limites exactes.

---

**Note :** Cette documentation est générale et applicable à n'importe quelle plateforme. Adaptez les exemples de code à votre langage et framework spécifiques.
