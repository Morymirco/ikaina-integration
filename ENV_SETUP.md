# Configuration des variables d'environnement

## Créer le fichier .env.local

Créez un fichier `.env.local` à la racine du projet `ikaina-integration-x/` avec le contenu suivant :

```env
TWITTER_CLIENT_ID=votre_client_id_ici
TWITTER_CLIENT_SECRET=votre_client_secret_ici
TWITTER_REDIRECT_URI=http://localhost:3000/api/auth/twitter/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Obtenir les credentials Twitter

1. Allez sur [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Créez une nouvelle application ou utilisez une existante
3. Dans l'onglet "Keys and tokens", vous trouverez :
   - **Client ID** → À mettre dans `TWITTER_CLIENT_ID`
   - **Client Secret** → À mettre dans `TWITTER_CLIENT_SECRET`

## Configurer le Callback URL

1. Dans le dashboard Twitter, allez dans les paramètres de votre application
2. Dans "App Settings" → "User authentication settings"
3. Ajoutez cette URL dans "Callback URI / Redirect URL" :
   ```
   http://localhost:3000/api/auth/twitter/callback
   ```
4. Sélectionnez "Read" pour les App permissions
5. Pour "Type of App", sélectionnez "Web App, Automated App or Bot"
6. Sauvegardez les modifications

## Pour la production

Quand vous déployez en production, mettez à jour :
- `TWITTER_REDIRECT_URI` avec votre URL de production
- `NEXT_PUBLIC_APP_URL` avec votre URL de production
- Configurez aussi cette URL dans le dashboard Twitter
