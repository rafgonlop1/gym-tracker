import { useEffect, useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { createSupabaseClient } from '~/lib/supabase.client';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (window.location.hash.includes('error')) {
      setHasError(true);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const error = hashParams.get('error_description');
      console.error('Auth error:', error);
    }

    const supabase = createSupabaseClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        {!hasError && (
          <>
            <div className="animate-spin text-4xl mb-4">💪</div>
            <p className="text-gray-600 dark:text-gray-400">
              Procesando autenticación...
            </p>
          </>
        )}

        {hasError && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg max-w-md">
            <p className="font-medium">Error de autenticación</p>
            <p className="text-sm mt-1">
              El enlace de verificación ha expirado o es inválido. Por favor,
              solicita un nuevo enlace de verificación.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-3 text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Volver al inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
