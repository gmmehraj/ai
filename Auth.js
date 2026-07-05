// ============================================
// AXIOM — Auth logic (Supabase)
// Loaded on every page after supabase-config.js.
// Handles: login/register form submits, logout, route protection
// for app pages, and populating the sidebar with real user data.
// ============================================

function authError(message) {
  let box = document.getElementById('authError');
  if (!box) return alert(message);
  box.textContent = message;
  box.style.display = 'block';
}
function clearAuthError() {
  const box = document.getElementById('authError');
  if (box) box.style.display = 'none';
}
function setBtnLoading(btn, loading, loadingText) {
  if (!btn) return;
  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = loadingText || 'Please wait…';
    btn.disabled = true;
    btn.style.opacity = '.7';
  } else {
    btn.textContent = btn.dataset.originalText || btn.textContent;
    btn.disabled = false;
    btn.style.opacity = '';
  }
}

// ============================================
// Register page
// ============================================
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthError();
    const fullName = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const submitBtn = registerForm.querySelector('button[type="submit"]');

    if (password.length < 6) {
      authError('Password must be at least 6 characters.');
      return;
    }

    setBtnLoading(submitBtn, true, 'Creating account…');
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    setBtnLoading(submitBtn, false);

    if (error) {
      authError(error.message);
      return;
    }
    if (data.session) {
      window.location.href = 'dashboard.html';
    } else {
      const card = document.querySelector('.auth-card');
      if (card) {
        card.innerHTML = `
          <div class="auth-head">
            <div class="auth-logo"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <p class="auth-eyebrow">Almost there</p>
            <h1>Check your inbox</h1>
            <p>We sent a confirmation link to <strong style="color:var(--text-hi)">${email}</strong>. Click it to activate your account.</p>
          </div>
          <div class="auth-foot"><a href="login.html">Back to sign in</a></div>
        `;
      }
    }
  });
}

// ============================================
// Login page
// ============================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthError();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    setBtnLoading(submitBtn, true, 'Signing in…');
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    setBtnLoading(submitBtn, false);

    if (error) {
      authError(error.message);
      return;
    }
    window.location.href = 'dashboard.html';
  });
}

// ============================================
// OAuth buttons (login + register pages)
// ============================================
document.querySelectorAll('[data-oauth]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const provider = btn.dataset.oauth;
    await supabaseClient.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + '/dashboard.html' }
    });
  });
});

// ============================================
// Logout (any page with a [data-logout] element)
// ============================================
document.querySelectorAll('[data-logout]').forEach(el => {
  el.addEventListener('click', async (e) => {
    e.preventDefault();
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
  });
});

// ============================================
// Route protection + sidebar user data for app pages
// Add data-require-auth to <body> on dashboard/playground/billing/settings
// ============================================
async function guardAndPopulate() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  const user = session.user;
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('full_name, avatar_url, plan, credits')
    .eq('id', user.id)
    .single();

  const displayName = profile?.full_name || user.email.split('@')[0];
  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const planLabel = { free: 'Studio', pro: 'Studio Pro', max: 'Studio Max' }[profile?.plan] || 'Studio';

  document.querySelectorAll('.app-user-name').forEach(el => el.textContent = displayName);
  document.querySelectorAll('.app-user-plan').forEach(el => el.textContent = planLabel);
  document.querySelectorAll('.app-avatar').forEach(el => { if (!el.querySelector('img')) el.textContent = initials; });
  document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = user.email);
  document.querySelectorAll('[data-user-credits]').forEach(el => el.textContent = (profile?.credits ?? 0).toLocaleString());

  // Credit bar fill — percentage of the plan's monthly cap
  const planCaps = { free: 500, pro: 8000, max: 20000 };
  const cap = planCaps[profile?.plan] || 500;
  const pct = Math.max(0, Math.min(100, Math.round(((profile?.credits ?? 0) / cap) * 100)));
  document.querySelectorAll('[data-credit-bar-fill]').forEach(el => el.style.width = pct + '%');

  // Billing page: reflect the real plan on the summary card + Pro plan button
  const planCardName = document.getElementById('planCardName');
  const planCardPrice = document.getElementById('planCardPrice');
  const proBadge = document.getElementById('proBadge');
  const proCheckoutBtn = document.getElementById('proCheckoutBtn');

  if (planCardName && planCardPrice) {
    if (profile?.plan === 'pro') {
      planCardName.textContent = 'Studio Pro';
      planCardPrice.textContent = '₹4,000/mo';
    } else if (profile?.plan === 'max') {
      planCardName.textContent = 'Studio Max';
      planCardPrice.textContent = 'Custom pricing';
    } else {
      planCardName.textContent = 'Studio';
      planCardPrice.textContent = 'Free forever';
    }
  }
  if (proBadge && proCheckoutBtn) {
    if (profile?.plan === 'pro') {
      proBadge.style.display = '';
      proCheckoutBtn.textContent = 'Current plan';
      proCheckoutBtn.disabled = true;
      proCheckoutBtn.style.opacity = '.6';
      proCheckoutBtn.style.cursor = 'default';
      proCheckoutBtn.removeAttribute('data-checkout');
    }
  }
}

if (document.body.hasAttribute('data-require-auth')) {
  guardAndPopulate();
}

// ============================================
// Marketing nav (index.html): swap Sign in/Get started
// for a Dashboard link when a session already exists
// ============================================
async function reflectAuthStateOnMarketingNav() {
  const ctaBox = document.querySelector('.nav-cta');
  if (!ctaBox) return;
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    ctaBox.innerHTML = `<a href="dashboard.html" class="btn btn-solid">Go to dashboard</a>`;
  }
}
if (document.querySelector('.nav-cta') && !document.body.hasAttribute('data-require-auth')) {
  reflectAuthStateOnMarketingNav();
}