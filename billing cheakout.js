// ============================================
// AXIOM — Billing / Razorpay checkout flow
// Loaded on billing.html only, after supabase-config.js + auth.js.
// ============================================

async function startCheckout(plan) {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  const btn = document.querySelector(`[data-checkout="${plan}"]`);
  const originalText = btn ? btn.textContent : null;
  if (btn) { btn.textContent = 'Preparing checkout…'; btn.disabled = true; }

  try {
    const createRes = await fetch(`${SUPABASE_URL}/functions/v1/create-razorpay-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ plan }),
    });
    const order = await createRes.json();

    if (!createRes.ok) {
      showToast(order.error || 'Could not start checkout');
      if (btn) { btn.textContent = originalText; btn.disabled = false; }
      return;
    }

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Axiom Studio',
      description: plan === 'pro' ? 'Studio Pro — monthly' : 'Axiom plan upgrade',
      order_id: order.order_id,
      prefill: { email: session.user.email },
      theme: { color: '#8B7CF6' },
      handler: async function (response) {
        if (btn) btn.textContent = 'Verifying payment…';
        const verifyRes = await fetch(`${SUPABASE_URL}/functions/v1/verify-razorpay-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(response),
        });
        const result = await verifyRes.json();

        if (result.success) {
          showToast('Payment successful — welcome to Studio Pro!');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          showToast(result.error || 'Payment verification failed');
          if (btn) { btn.textContent = originalText; btn.disabled = false; }
        }
      },
      modal: {
        ondismiss: function () {
          if (btn) { btn.textContent = originalText; btn.disabled = false; }
        },
      },
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function (resp) {
      showToast('Payment failed: ' + (resp.error?.description || 'please try again'));
      if (btn) { btn.textContent = originalText; btn.disabled = false; }
    });
    rzp.open();
  } catch (err) {
    showToast('Something went wrong starting checkout');
    if (btn) { btn.textContent = originalText; btn.disabled = false; }
  }
}

document.querySelectorAll('[data-checkout]').forEach(btn => {
  btn.addEventListener('click', () => startCheckout(btn.dataset.checkout));
});