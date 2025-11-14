'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<TwitterUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // États pour les fonctionnalités
  const [tweetText, setTweetText] = useState('');
  const [replyTweetId, setReplyTweetId] = useState('');
  const [dmRecipient, setDmRecipient] = useState('');
  const [dmText, setDmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
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
      router.push('/');
    }
    setIsLoading(false);
  }, [router]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreateTweet = async () => {
    if (!tweetText.trim()) {
      showMessage('error', 'Veuillez entrer un texte pour votre tweet');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/twitter/tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: tweetText }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', `Tweet créé avec succès! ID: ${data.tweet.id}`);
        setTweetText('');
      } else {
        showMessage('error', data.error || 'Erreur lors de la création du tweet');
      }
    } catch (error) {
      showMessage('error', 'Erreur lors de la création du tweet');
    } finally {
      setLoading(false);
    }
  };

  const handleReplyTweet = async () => {
    if (!tweetText.trim() || !replyTweetId.trim()) {
      showMessage('error', 'Veuillez entrer le texte et l\'ID du tweet à répondre');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/twitter/tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: tweetText, replyToTweetId: replyTweetId }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', `Réponse créée avec succès! ID: ${data.tweet.id}`);
        setTweetText('');
        setReplyTweetId('');
      } else {
        showMessage('error', data.error || 'Erreur lors de la création de la réponse');
      }
    } catch (error) {
      showMessage('error', 'Erreur lors de la création de la réponse');
    } finally {
      setLoading(false);
    }
  };

  const handleSendDM = async () => {
    if (!dmText.trim() || !dmRecipient.trim()) {
      showMessage('error', 'Veuillez entrer le destinataire et le message');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/twitter/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientUsername: dmRecipient.startsWith('@') ? dmRecipient.slice(1) : dmRecipient,
          text: dmText,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', 'Message privé envoyé avec succès!');
        setDmText('');
        setDmRecipient('');
      } else {
        showMessage('error', data.error || 'Erreur lors de l\'envoi du message privé');
      }
    } catch (error) {
      showMessage('error', 'Erreur lors de l\'envoi du message privé');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
          <div className="flex items-center gap-4">
            {user.profile_image_url && (
              <img
                src={user.profile_image_url}
                alt={user.name}
                className="h-16 w-16 rounded-full"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dashboard Twitter
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Connecté en tant que @{user.username}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
          >
            Déconnexion
          </button>
        </div>

        {/* Message de notification */}
        {message && (
          <div
            className={`mb-6 rounded-lg p-4 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Créer un Tweet */}
          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              1. Créer un Tweet
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Texte du tweet (max 280 caractères)
                </label>
                <textarea
                  value={tweetText}
                  onChange={(e) => setTweetText(e.target.value)}
                  maxLength={280}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 p-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Quoi de neuf ?"
                />
                <p className="mt-1 text-sm text-gray-500">
                  {tweetText.length}/280 caractères
                </p>
              </div>
              <button
                onClick={handleCreateTweet}
                disabled={loading || !tweetText.trim()}
                className="w-full rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Publication...' : 'Publier le Tweet'}
              </button>
            </div>
          </div>

          {/* Répondre à un Tweet */}
          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              2. Répondre à un Tweet
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ID du tweet à répondre
                </label>
                <input
                  type="text"
                  value={replyTweetId}
                  onChange={(e) => setReplyTweetId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="1234567890123456789"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Votre réponse (max 280 caractères)
                </label>
                <textarea
                  value={tweetText}
                  onChange={(e) => setTweetText(e.target.value)}
                  maxLength={280}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 p-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Votre réponse..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  {tweetText.length}/280 caractères
                </p>
              </div>
              <button
                onClick={handleReplyTweet}
                disabled={loading || !tweetText.trim() || !replyTweetId.trim()}
                className="w-full rounded-lg bg-purple-500 px-4 py-2 text-white transition-colors hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Publication...' : 'Répondre au Tweet'}
              </button>
            </div>
          </div>

          {/* Envoyer un Message Privé */}
          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800 md:col-span-2">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              3. Envoyer un Message Privé (DM)
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Username du destinataire (sans @)
                </label>
                <input
                  type="text"
                  value={dmRecipient}
                  onChange={(e) => setDmRecipient(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Message
                </label>
                <textarea
                  value={dmText}
                  onChange={(e) => setDmText(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 p-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Votre message privé..."
                />
              </div>
            </div>
            <button
              onClick={handleSendDM}
              disabled={loading || !dmText.trim() || !dmRecipient.trim()}
              className="mt-4 w-full rounded-lg bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
              {loading ? 'Envoi...' : 'Envoyer le Message Privé'}
            </button>
          </div>
        </div>

        {/* Informations */}
        <div className="mt-8 rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
          <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-400">
            💡 Informations importantes :
          </h3>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
            <li>• Pour répondre à un tweet, vous devez utiliser l'ID numérique du tweet</li>
            <li>• Les messages privés nécessitent que vous suiviez l'utilisateur ou qu'il vous suive</li>
            <li>• Vérifiez que votre application Twitter a les bonnes permissions (tweet.write, dm.write)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
