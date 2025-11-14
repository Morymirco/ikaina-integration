import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Supprimer tous les cookies liés à Twitter
    cookieStore.delete('twitter_access_token');
    cookieStore.delete('twitter_refresh_token');
    cookieStore.delete('twitter_user');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la déconnexion' },
      { status: 500 }
    );
  }
}
