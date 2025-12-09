// userInfo.js — local/demo profile storage and UI handlers
(function () {
  const PROFILE_KEY = 'ct_userProfile';
  // Supabase DB client (will initialize if supabase is available)
  let db = null;
  let currentUser = null; // { id, username, email }

  const SUPABASE_URL = 'https://ryehvditehqzslcvpdqz.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZWh2ZGl0ZWhxenNsY3ZwZHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NDQ5MjgsImV4cCI6MjA4MDQyMDkyOH0.u9g9RagPPboQTPnaMPXK9fppuQDyjIoL-idQsQI8ztw';

  // DOM refs
  const avatarPreview = document.getElementById('avatarPreview');
  const avatarInput = document.getElementById('avatarInput');
  const avatarInfo = document.getElementById('avatarInfo');

  const displayName = document.getElementById('displayName');
  const firstName = document.getElementById('firstName');
  const lastName = document.getElementById('lastName');
  const email = document.getElementById('email');
  const description = document.getElementById('description');

  const saveProfileBtn = document.getElementById('saveProfile');
  const resetProfileBtn = document.getElementById('resetProfile');
  const saveMsg = document.getElementById('saveMsg');

  const currentPassword = document.getElementById('currentPassword');
  const newPassword = document.getElementById('newPassword');
  const confirmPassword = document.getElementById('confirmPassword');
  const changePwdBtn = document.getElementById('changePwd');
  const pwdMsg = document.getElementById('pwdMsg');

  const resetAvatarBtn = document.getElementById('resetAvatar');
  const exportBtn = document.getElementById('exportProfile');
  const importBtn = document.getElementById('importProfileBtn');
  const importInput = document.getElementById('importProfile');

  let stagedAvatarDataUrl = null;

  // Default avatar (relative to this page)
  const DEFAULT_AVATAR = './defaultavatar.png';

  // Default empty profile
  function defaultProfile() {
    return {
      displayName: '',
      firstName: '',
      lastName: '',
      email: '',
      description: '',
      avatar: DEFAULT_AVATAR, // default avatar path
      // For demo only: password stored as base64 of plain text. Not secure.
      password: ''
    };
  }

  function loadProfile() {
    // Try to load from Supabase if available and user logged in
    const rawLocal = localStorage.getItem(PROFILE_KEY);
    const localProfile = rawLocal ? JSON.parse(rawLocal) : defaultProfile();

    // If Supabase available and user present, try to fetch remote profile
    const storedUser = localStorage.getItem('currentUser') || localStorage.getItem('user');
    if (storedUser && window.supabase) {
      try {
        currentUser = JSON.parse(storedUser);
        if (!db && window.supabase) db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        // Fetch user row by id or username
        (async () => {
          try {
            let query = db.from('users').select('*');
            if (currentUser.id) query = query.eq('id', currentUser.id).maybeSingle();
            else if (currentUser.username) query = query.eq('username', currentUser.username).maybeSingle();
            const { data, error } = await query;
            if (!error && data) {
              // Map remote columns to our UI
              displayName.value = data.display_name || data.username || localProfile.displayName || '';
              firstName.value = data.first_name || localProfile.firstName || '';
              lastName.value = data.last_name || localProfile.lastName || '';
              email.value = data.email || localProfile.email || '';
              description.value = data.description || localProfile.description || '';
              stagedAvatarDataUrl = null;
              if (data.avatar) {
                avatarPreview.src = data.avatar;
              } else if (localProfile.avatar) {
                avatarPreview.src = localProfile.avatar;
              } else {
                // show default avatar (fallback to initials SVG if image not found)
                const initials = (data && (data.display_name || data.username)) ? (data.display_name || data.username).split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase() : '';
                avatarPreview.onerror = function () { avatarPreview.onerror = null; avatarPreview.src = svgPlaceholder(initials); };
                avatarPreview.src = getDefaultAvatar(initials);
              }
              // persist a local copy
              const merged = Object.assign(defaultProfile(), {
                displayName: displayName.value,
                firstName: firstName.value,
                lastName: lastName.value,
                email: email.value,
                description: description.value,
                avatar: data.avatar || localProfile.avatar || DEFAULT_AVATAR
              });
              localStorage.setItem(PROFILE_KEY, JSON.stringify(merged));
              return;
            }
          } catch (err) {
            console.warn('Could not load remote profile', err?.message || err);
          }
          // Fallback to local profile
          displayName.value = localProfile.displayName || '';
          firstName.value = localProfile.firstName || '';
          lastName.value = localProfile.lastName || '';
          email.value = localProfile.email || '';
          description.value = localProfile.description || '';
          stagedAvatarDataUrl = null;
          if (localProfile.avatar) {
            avatarPreview.src = localProfile.avatar;
          } else {
            const initials = (localProfile.displayName||'').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
            avatarPreview.onerror = function () { avatarPreview.onerror = null; avatarPreview.src = svgPlaceholder(initials); };
            avatarPreview.src = getDefaultAvatar(initials);
          }
        })();
        return;
      } catch (err) {
        console.warn('Profile load parse error', err);
      }
    }

    // No supabase or no logged-in user: use local profile
    displayName.value = localProfile.displayName || '';
    firstName.value = localProfile.firstName || '';
    lastName.value = localProfile.lastName || '';
    email.value = localProfile.email || '';
    description.value = localProfile.description || '';
    stagedAvatarDataUrl = null;
    if (localProfile.avatar) {
      avatarPreview.src = localProfile.avatar;
    } else {
      const initials = (localProfile.displayName||'').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
      avatarPreview.onerror = function () { avatarPreview.onerror = null; avatarPreview.src = svgPlaceholder(initials); };
      avatarPreview.src = getDefaultAvatar(initials);
    }
  }

  async function saveProfile() {
    // validate inputs before saving
    if (!validateProfileInputs()) return;

    const raw = localStorage.getItem(PROFILE_KEY);
    const profile = raw ? JSON.parse(raw) : defaultProfile();

    profile.displayName = displayName.value.trim();
    profile.firstName = firstName.value.trim();
    profile.lastName = lastName.value.trim();
    profile.email = email.value.trim();
    profile.description = description.value.trim();

    if (stagedAvatarDataUrl !== null) {
      profile.avatar = stagedAvatarDataUrl;
    } else if (!profile.avatar) {
      // ensure every saved profile has a default avatar
      profile.avatar = DEFAULT_AVATAR;
    }

    // Save locally first
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

    // If Supabase available and user logged in, update remote record
    const storedUser = localStorage.getItem('currentUser') || localStorage.getItem('user');
    if (storedUser && window.supabase) {
      try {
        if (!db) db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        if (!currentUser) currentUser = JSON.parse(storedUser);

        const updates = {
          display_name: profile.displayName,
          first_name: profile.firstName,
          last_name: profile.lastName,
          email: profile.email,
          description: profile.description,
          avatar: profile.avatar
        };

        // Use id when available, otherwise username
        let query = db.from('users');
        if (currentUser.id) query = query.update(updates).eq('id', currentUser.id).select().maybeSingle();
        else if (currentUser.username) query = query.update(updates).eq('username', currentUser.username).select().maybeSingle();
        else query = null;

        if (query) {
          const { data, error } = await query;
          if (error) throw error;
          showMessage(saveMsg, 'Profile saved (local + remote)', 'success');
          return;
        }
      } catch (err) {
        console.warn('Remote save failed:', err?.message || err);
        showMessage(saveMsg, 'Saved locally (remote failed)', 'error');
        return;
      }
    }

    showMessage(saveMsg, 'Profile saved locally', 'success');
  }

  function resetProfile() {
    localStorage.removeItem(PROFILE_KEY);
    stagedAvatarDataUrl = null;
    loadProfile();
    showMessage(saveMsg, 'Profile reset to defaults', 'success');
  }

  function showMessage(el, msg, type) {
    el.textContent = msg;
    el.classList.remove('error', 'success');
    if (type === 'error') el.classList.add('error');
    else if (type === 'success') el.classList.add('success');
    // also show a toast for more visible feedback
    showToast(msg, type);
    setTimeout(() => { el.textContent = ''; el.classList.remove('error', 'success'); }, 3500);
  }

  // Toast helper
  function showToast(message, type = 'success', opts = {}) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast ' + (type === 'error' ? 'error' : 'success');
    toast.setAttribute('role', 'status');
    toast.innerHTML = `<div class="toast-body">${message}</div>`;

    // insert at top
    container.prepend(toast);

    // animate in
    requestAnimationFrame(() => { toast.classList.add('visible'); });

    const ttl = opts.ttl || 3500;
    const timeoutId = setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, ttl);

    // allow click to dismiss
    toast.addEventListener('click', () => {
      clearTimeout(timeoutId);
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 200);
    });
  }

  function handleAvatarChange(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showMessage(avatarInfo, 'Please pick an image file', 'error');
      return;
    }

    // Try to resize/compress the image to keep it under ~200KB
    const MAX_KB = 200;
    resizeImageFile(file, MAX_KB).then(({ dataUrl, sizeKB, warned }) => {
      stagedAvatarDataUrl = dataUrl;
      avatarPreview.src = stagedAvatarDataUrl;
      avatarInfo.textContent = `Loaded ${file.name} (${Math.round(sizeKB)} KB)`;
      if (warned) showMessage(avatarInfo, 'Image compressed to fit limit', 'success');
      else showMessage(avatarInfo, 'Avatar ready (save to persist)', 'success');
    }).catch(err => {
      console.warn('Avatar resize error', err);
      // fallback: read original
      const reader = new FileReader();
      reader.onload = function (e) {
        stagedAvatarDataUrl = e.target.result;
        avatarPreview.src = stagedAvatarDataUrl;
        avatarInfo.textContent = `Loaded ${file.name} (${Math.round(file.size/1024)} KB)`;
        showMessage(avatarInfo, 'Avatar loaded (original)', 'success');
      };
      reader.readAsDataURL(file);
    });
  }

  // Resize/compress an image File to be under maxKB (approximately). Returns {dataUrl, sizeKB, warned}
  function resizeImageFile(file, maxKB) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const MAX_DIM = 800; // maximum width/height
          let { width, height } = img;
          let scale = Math.min(1, MAX_DIM / Math.max(width, height));
          let canvas = document.createElement('canvas');
          let ctx = canvas.getContext('2d');

          // initial scaled dimensions
          canvas.width = Math.round(width * scale);
          canvas.height = Math.round(height * scale);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // try several quality levels and downsizing steps until under limit
          const targetBytes = maxKB * 1024;
          let quality = 0.92;
          const minQuality = 0.5;
          let warned = false;

          function attempt() {
            try {
              const dataUrl = canvas.toDataURL('image/jpeg', quality);
              const size = Math.round((dataUrl.length * 3) / 4 / 1024); // approx KB
              if (size <= maxKB || quality <= minQuality) {
                // if still too large at minQuality, try to downsize dimensions
                if (size > maxKB && quality <= minQuality) {
                  // reduce dimensions and retry
                  width = Math.max(64, Math.round(canvas.width * 0.85));
                  height = Math.max(64, Math.round(canvas.height * 0.85));
                  canvas.width = width;
                  canvas.height = height;
                  ctx.drawImage(img, 0, 0, width, height);
                  quality = 0.85; // reset quality
                  warned = true;
                  // continue attempts
                  return attempt();
                }
                resolve({ dataUrl, sizeKB: size, warned });
              } else {
                // reduce quality and retry
                quality = Math.max(minQuality, quality - 0.12);
                // if we've reached minQuality and still large, will downsize next loop
                return attempt();
              }
            } catch (err) {
              reject(err);
            }
          }

          attempt();
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Create a simple SVG placeholder as data URL with optional initials
  function svgPlaceholder(initials = '') {
    const bg = '#061014';
    const fg = '#00ff9f';
    const text = initials || '';
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><rect width='100%' height='100%' fill='${bg}' rx='12' ry='12'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Courier New, monospace' font-size='48' fill='${fg}'>${text}</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  // Return the default avatar path (falls back to SVG placeholder if image fails to load)
  function getDefaultAvatar(initials = '') {
    // Use global constant so the path is consistent
    return DEFAULT_AVATAR;
  }

  function resetAvatar() {
    stagedAvatarDataUrl = '';
    // restore default avatar image
    const initials = (displayName.value || '').split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase();
    avatarPreview.onerror = function () { avatarPreview.onerror = null; avatarPreview.src = svgPlaceholder(initials); };
    avatarPreview.src = getDefaultAvatar(initials);
    avatarInfo.textContent = 'Avatar cleared — save profile to persist.';
  }

  // Password helpers (demo only)
  function encoded(p) { return p ? btoa(p) : ''; }
  function decoded(e) { return e ? atob(e) : ''; }

  function changePassword() {
    const raw = localStorage.getItem(PROFILE_KEY);
    const profile = raw ? JSON.parse(raw) : defaultProfile();
    const storedEnc = profile.password || '';
    const stored = decoded(storedEnc);

    const cur = currentPassword.value || '';
    const nw = newPassword.value || '';
    const conf = confirmPassword.value || '';

    if (stored && cur !== stored) {
      showMessage(pwdMsg, 'Current password is incorrect', 'error');
      return;
    }
    if (!nw) { showMessage(pwdMsg, 'New password cannot be empty', 'error'); return; }
    if (nw.length < 6) { showMessage(pwdMsg, 'New password must be at least 6 characters', 'error'); return; }
    if (nw !== conf) { showMessage(pwdMsg, 'Passwords do not match', 'error'); return; }

    profile.password = encoded(nw);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    // Update remote password if possible (demo plaintext)
    const storedUser = localStorage.getItem('currentUser') || localStorage.getItem('user');
    if (storedUser && window.supabase) {
      try {
        if (!db) db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        if (!currentUser) currentUser = JSON.parse(storedUser);
        let query = db.from('users');
        if (currentUser.id) query = query.update({ password: nw }).eq('id', currentUser.id).select().maybeSingle();
        else if (currentUser.username) query = query.update({ password: nw }).eq('username', currentUser.username).select().maybeSingle();
        if (query) {
          const { error } = awaitquery;
          if (error) throw error;
        }
      } catch (err) {
        console.warn('Failed to update remote password', err?.message || err);
      }
    }

    currentPassword.value = newPassword.value = confirmPassword.value = '';
    showMessage(pwdMsg, 'Password changed (demo only)', 'success');
  }

  // Export profile JSON
  function exportProfile() {
    const raw = localStorage.getItem(PROFILE_KEY) || JSON.stringify(defaultProfile());
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cypher_profile.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importProfileFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const obj = JSON.parse(e.target.result);
        // Basic validation
        const p = Object.assign(defaultProfile(), obj);
        localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
        loadProfile();
        showMessage(saveMsg, 'Profile imported', 'success');
      } catch (err) {
        showMessage(saveMsg, 'Failed to import profile', 'error');
      }
    };
    reader.readAsText(file);
  }

  // Validation helpers
  function isValidEmail(val) {
    if (!val) return true; // optional
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }

  function validateProfileInputs() {
    const name = displayName.value.trim();
    const fn = firstName.value.trim();
    const ln = lastName.value.trim();
    const em = email.value.trim();

    if (!name && (!fn || !ln)) {
      showMessage(saveMsg, 'Provide a display name or both first and last names', 'error');
      return false;
    }
    if (em && !isValidEmail(em)) {
      showMessage(saveMsg, 'Please enter a valid email address', 'error');
      return false;
    }
    return true;
  }

  // Event wiring
  if (avatarInput) avatarInput.addEventListener('change', (e) => handleAvatarChange(e.target.files[0]));
  if (resetAvatarBtn) resetAvatarBtn.addEventListener('click', resetAvatar);
  if (saveProfileBtn) saveProfileBtn.addEventListener('click', saveProfile);
  if (resetProfileBtn) resetProfileBtn.addEventListener('click', resetProfile);
  if (changePwdBtn) changePwdBtn.addEventListener('click', (e) => { e.preventDefault(); changePassword(); });
  if (exportBtn) exportBtn.addEventListener('click', exportProfile);
  if (importBtn && importInput) importBtn.addEventListener('click', () => importInput.click());
  if (importInput) importInput.addEventListener('change', (e) => importProfileFile(e.target.files[0]));

  // init
  loadProfile();
})();

/* Simple Matrix background (replaced previous implementation) */
(function () {
  const canvas = document.getElementById('matrixCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const letters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアカサタナハマヤラワ".split("");
  const fontSize = 16;
  const columns = Math.floor(window.innerWidth / fontSize) || 1;
  let drops = [];
  for (let i = 0; i < columns; i++) { drops[i] = Math.random() * -100; }

  function draw() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0F0";
    ctx.font = fontSize + "px monospace";
    for (let i = 0; i < drops.length; i++) {
      const text = letters[Math.floor(Math.random() * letters.length)];
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) { drops[i] = 0; }
      drops[i]++;
    }
  }

  setInterval(draw, 40);
})();

const canvas = document.getElementById('matrixCanvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.onresize = resize;

    const letters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアカサタナハマヤラワ".split("");

    const fontSize = 16;
    const columns = Math.floor(window.innerWidth / fontSize);

    // Drops start at random heights
    let drops = [];
    for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -100;
    }

    function draw() {
        // Black background with slight opacity = trail effect
        ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#0F0"; // Matrix green
        ctx.font = fontSize + "px monospace";

        for (let i = 0; i < drops.length; i++) {
            const text = letters[Math.floor(Math.random() * letters.length)];

            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            // Random reset so streams vary
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }

            drops[i]++;
        }
    }

    setInterval(draw, 40);