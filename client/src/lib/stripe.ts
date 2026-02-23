import { apiRequest } from './queryClient';

export async function redirectToCheckout(returnTo?: string) {
  const res = await apiRequest('POST', '/api/create-checkout-session', { returnTo });
  const data = await res.json() as { url?: string; error?: string };
  if (!data.url) {
    throw new Error(data.error || 'No checkout URL returned');
  }
  window.location.href = data.url;
}

export async function redirectToPortal() {
  try {
    const res = await apiRequest('POST', '/api/create-portal-session', {});
    const session = await res.json() as { url: string };
    window.location.href = session.url;
  } catch (error) {
    console.error('Error redirecting to portal:', error);
    throw error;
  }
}
