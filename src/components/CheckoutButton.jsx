import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function CheckoutButton({ label = 'Assinar', className = '', ariaLabel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Get the user's session and access token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Usuário não autenticado. Por favor, faça o login.');
      }

      // 2. Call the backend to create a checkout session
      const response = await fetch('/api/billing/stripe/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || 'Falha ao criar a sessão de checkout.');
      }

      // 3. Redirect to the Stripe checkout URL
      if (body.url) {
        window.location.href = body.url;
      } else {
        throw new Error('URL de checkout não recebida do servidor.');
      }

    } catch (err) {
      console.error('Checkout Error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <button 
        onClick={handleClick} 
        className={`btn btn-primary ${className}`.trim()} 
        aria-label={ariaLabel || 'Assinar plano'}
        disabled={loading}
      >
        {loading ? 'Carregando...' : label}
      </button>
      {error && <p className="text-red-500 text-sm mt-2">Erro: {error}</p>}
    </div>
  );
}
