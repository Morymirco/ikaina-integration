# Intégration X (Twitter) OAuth 2.0

Application Next.js pour l'intégration de l'authentification OAuth 2.0 avec X (Twitter).

## 🚀 Fonctionnalités

- ✅ Authentification OAuth 2.0 avec X (Twitter)
- ✅ Utilisation de PKCE (Proof Key for Code Exchange) pour la sécurité
- ✅ Gestion des tokens d'accès et de rafraîchissement
- ✅ Protection CSRF avec state
- ✅ Affichage du profil utilisateur connecté
- ✅ Interface moderne avec Tailwind CSS

## 📋 Prérequis

1. **Compte développeur Twitter/X**
   - Créez un compte sur [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
   - Créez une nouvelle application
   - Notez votre `Client ID` et `Client Secret`

2. **Configuration de l'application Twitter**
   - Dans les paramètres de votre application, configurez :
     - **Callback URL**: `http://localhost:3000/api/auth/twitter/callback`
     - **App permissions**: Read (au minimum)
     - **Type of App**: Web App, Automated App or Bot

## 🛠️ Installation

1. **Installer les dépendances**

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

2. **Configurer les variables d'environnement**

Créez un fichier `.env.local` à la racine du projet :

```env
TWITTER_CLIENT_ID=votre_client_id_ici
TWITTER_CLIENT_SECRET=votre_client_secret_ici
TWITTER_REDIRECT_URI=http://localhost:3000/api/auth/twitter/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Lancer le serveur de développement**

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📁 Structure du projet

```
ikaina-integration-x/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── twitter/
│   │       │   ├── route.ts          # Initie le flux OAuth
│   │       │   └── callback/
│   │       │       └── route.ts      # Gère le callback OAuth
│   │       └── logout/
│   │           └── route.ts          # Route de déconnexion
│   ├── profile/
│   │   └── page.tsx                  # Page de profil utilisateur
│   ├── layout.tsx                    # Layout principal
│   ├── page.tsx                      # Page d'accueil avec bouton de connexion
│   └── globals.css                   # Styles globaux
├── lib/
│   └── twitter-oauth.ts              # Utilitaires OAuth
└── .env.local                        # Variables d'environnement (à créer)
```

## 🔐 Flux OAuth 2.0

1. L'utilisateur clique sur "Se connecter avec X"
2. Redirection vers Twitter pour autorisation
3. Twitter redirige vers `/api/auth/twitter/callback` avec un code
4. Échange du code contre un access token
5. Récupération des informations utilisateur
6. Redirection vers la page de profil

## 🧪 Test

1. Lancez l'application : `npm run dev`
2. Accédez à `http://localhost:3000`
3. Cliquez sur "Se connecter avec X"
4. Autorisez l'application sur Twitter
5. Vous serez redirigé vers la page de profil avec vos informations

## 📚 Documentation

- [Twitter OAuth 2.0 Documentation](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [Next.js Documentation](https://nextjs.org/docs)

## ⚠️ Notes importantes

- En production, configurez votre callback URL avec votre domaine réel
- Les tokens sont stockés dans des cookies httpOnly pour la sécurité
- Pour la production, considérez l'utilisation d'une session sécurisée ou JWT
- Le `TWITTER_REDIRECT_URI` doit correspondre exactement à celui configuré dans le dashboard Twitter

## 🐛 Dépannage

**Erreur : "Configuration OAuth manquante"**
- Vérifiez que toutes les variables d'environnement sont définies dans `.env.local`

**Erreur : "invalid_state"**
- Assurez-vous que les cookies sont activés dans votre navigateur

**Erreur : "redirect_uri_mismatch"**
- Vérifiez que l'URL de callback dans `.env.local` correspond exactement à celle configurée dans le dashboard Twitter

## 📝 Licence

Ce projet est fourni à des fins éducatives et de démonstration.
