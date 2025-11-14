'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ErrorDisplay() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(errorParam);
    }
  }, [searchParams]);

  if (!error) return null;

  return (
    <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
      <p className="text-sm font-medium">Erreur: {error}</p>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Rediriger vers la route API qui initie le flux OAuth
      router.push('/api/auth/twitter');
    } catch (err) {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="flex flex-col items-center justify-center px-8 py-16">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-800">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
              Intégration X (Twitter)
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Connectez-vous avec votre compte X (Twitter) pour continuer
            </p>
          </div>

          <Suspense fallback={null}>
            <ErrorDisplay />
          </Suspense>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-black px-6 py-4 text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            {isLoading ? (
              <>
                <svg
                  className="h-5 w-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Connexion en cours...</span>
              </>
            ) : (
              <span>Se connecter avec X</span>
            )}
          </button>

          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              En vous connectant, vous acceptez nos conditions d'utilisation
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            💡 Configurez vos variables d'environnement dans{' '}
            <code className="rounded bg-gray-200 px-2 py-1 dark:bg-gray-700">
              .env.local
            </code>
          </p>
        </div>
      </main>
    </div>
  );
}
