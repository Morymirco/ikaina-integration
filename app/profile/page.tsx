'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<TwitterUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Récupérer les données utilisateur depuis le cookie
    const userCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('twitter_user='));

    if (userCookie) {
      try {
        const userData = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
        setUser(userData);
      } catch (error) {
        console.error('Erreur lors de la lecture des données utilisateur:', error);
      }
    } else {
      // Rediriger vers la page d'accueil si l'utilisateur n'est pas connecté
      router.push('/');
    }
    setIsLoading(false);
  }, [router]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/');
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-black dark:border-t-white"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="w-full max-w-2xl px-8 py-16">
        <div className="rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-800">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              Profil connecté
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Vous êtes connecté avec votre compte X (Twitter)
            </p>
          </div>

          <div className="mb-8 flex flex-col items-center rounded-lg bg-gray-50 p-6 dark:bg-gray-700/50">
            {user.profile_image_url && (
              <div className="mb-4 overflow-hidden rounded-full">
                <Image
                  src={user.profile_image_url}
                  alt={user.name}
                  width={120}
                  height={120}
                  className="rounded-full"
                />
              </div>
            )}

            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              {user.name}
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              @{user.username}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              ID: {user.id}
            </p>
          </div>

          <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <p className="text-sm font-medium">
              ✅ Authentification OAuth 2.0 réussie !
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleLogout}
              className="w-full rounded-lg bg-red-500 px-6 py-3 text-white transition-colors hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Se déconnecter
            </button>

            <button
              onClick={() => router.push('/')}
              className="w-full rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Retour à l'accueil
            </button>
          </div>

          <div className="mt-8 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-400">
              Informations techniques :
            </h3>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
              <li>• Utilisation de OAuth 2.0 avec PKCE</li>
              <li>• Tokens stockés de manière sécurisée</li>
              <li>• Support du refresh token</li>
              <li>• Protection CSRF avec state</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
