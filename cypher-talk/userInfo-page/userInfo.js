// userInfo.js – local/demo profile storage and UI handlers
(function () {
  const PROFILE_KEY = 'ct_userProfile';
  // Supabase DB client (will initialize if supabase is available)
  let db = null;
  let currentUser = null; // { id, username, email }

  const SUPABASE_URL = 'https://ryehvditehqzslcvpdqz.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZWh2ZGl0ZWhxenNsY3ZwZHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NDQ5MjgsImV4cCI6MjA4MDQyMDkyOH0.u9g9RagPPboQTPnaMPXK9fppuQDyjIoL-idQsQI8ztw';

  // Verify credentials function (moved inside IIFE)
  async function verifyCredentials(username, password) {
    try {
      if (!window.supabase) {
        throw new Error('Database connection not available');
      }

      if (!db) db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      // Check if user exists and password matches
      const { data: user, error } = await db
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !user) {
        console.error('User lookup error:', error);
        return { success: false, error: 'User not found' };
      }

      // Check password (plain text comparison as used in login)
      if (user.password !== password) {
        console.log('Password mismatch');
        return { success: false, error: 'Invalid password' };
      }

      console.log('Credentials verified for user:', user.id);
      return { success: true, user };

    } catch (error) {
      console.error('Verify credentials error:', error);
      return { success: false, error: error.message };
    }
  }

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
  const DEFAULT_AVATAR = '/userInfo-page/defaultavatar.png';

  // Default empty profile
  function defaultProfile() {
    return {
      displayName: '',
      firstName: '',
      lastName: '',
      email: '',
      description: '',
      avatar: DEFAULT_AVATAR,
      password: ''
    };
  }

  function loadProfile() {
    const rawLocal = localStorage.getItem(PROFILE_KEY);
    const localProfile = rawLocal ? JSON.parse(rawLocal) : defaultProfile();

    const storedUser = localStorage.getItem('currentUser') || localStorage.getItem('user');
    if (storedUser && window.supabase) {
      try {
        currentUser = JSON.parse(storedUser);
        if (!db && window.supabase) db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        (async () => {
          try {
            let query = db.from('users').select('*');
            if (currentUser.id) query = query.eq('id', currentUser.id).maybeSingle();
            else if (currentUser.username) query = query.eq('username', currentUser.username).maybeSingle();
            const { data, error } = await query;
            if (!error && data) {
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
                const initials = (data && (data.display_name || data.username)) ? (data.display_name || data.username).split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase() : '';
                avatarPreview.onerror = function () { avatarPreview.onerror = null; avatarPreview.src = svgPlaceholder(initials); };
                avatarPreview.src = getDefaultAvatar(initials);
              }
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
          displayName.value = localProfile.displayName || '';
          firstName.value = localProfile.firstName || '';
          lastName.value = localProfile.lastName || '';
          email.value = localProfile.email || '';
          description.value = localProfile.description || '';
          stagedAvatarDataUrl = null;
          if (localProfile.avatar) {
            avatarPreview.src = localProfile.avatar;
          } else {
            const initials = (localProfile.displayName || '').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
            avatarPreview.onerror = function () { avatarPreview.onerror = null; avatarPreview.src = svgPlaceholder(initials); };
            avatarPreview.src = getDefaultAvatar(initials);
          }
        })();
        return;
      } catch (err) {
        console.warn('Profile load parse error', err);
      }
    }

    displayName.value = localProfile.displayName || '';
    firstName.value = localProfile.firstName || '';
    lastName.value = localProfile.lastName || '';
    email.value = localProfile.email || '';
    description.value = localProfile.description || '';
    stagedAvatarDataUrl = null;
    if (localProfile.avatar) {
      avatarPreview.src = localProfile.avatar;
    } else {
      const initials = (localProfile.displayName || '').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
      avatarPreview.onerror = function () { avatarPreview.onerror = null; avatarPreview.src = svgPlaceholder(initials); };
      avatarPreview.src = getDefaultAvatar(initials);
    }
  }

  async function saveProfile() {
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
      profile.avatar = DEFAULT_AVATAR;
    }

    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

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
    showToast(msg, type);
    setTimeout(() => { el.textContent = ''; el.classList.remove('error', 'success'); }, 3500);
  }

  function showToast(message, type = 'success', opts = {}) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast ' + (type === 'error' ? 'error' : 'success');
    toast.setAttribute('role', 'status');
    toast.innerHTML = `<div class="toast-body">${message}</div>`;

    container.prepend(toast);

    requestAnimationFrame(() => { toast.classList.add('visible'); });

    const ttl = opts.ttl || 3500;
    const timeoutId = setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, ttl);

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

    const MAX_KB = 200;
    resizeImageFile(file, MAX_KB).then(({ dataUrl, sizeKB, warned }) => {
      stagedAvatarDataUrl = dataUrl;
      avatarPreview.src = stagedAvatarDataUrl;
      avatarInfo.textContent = `Loaded ${file.name} (${Math.round(sizeKB)} KB)`;
      if (warned) showMessage(avatarInfo, 'Image compressed to fit limit', 'success');
      else showMessage(avatarInfo, 'Avatar ready (save to persist)', 'success');
    }).catch(err => {
      console.warn('Avatar resize error', err);
      const reader = new FileReader();
      reader.onload = function (e) {
        stagedAvatarDataUrl = e.target.result;
        avatarPreview.src = stagedAvatarDataUrl;
        avatarInfo.textContent = `Loaded ${file.name} (${Math.round(file.size / 1024)} KB)`;
        showMessage(avatarInfo, 'Avatar loaded (original)', 'success');
      };
      reader.readAsDataURL(file);
    });
  }

  function resizeImageFile(file, maxKB) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const MAX_DIM = 800;
          let { width, height } = img;
          let scale = Math.min(1, MAX_DIM / Math.max(width, height));
          let canvas = document.createElement('canvas');
          let ctx = canvas.getContext('2d');

          canvas.width = Math.round(width * scale);
          canvas.height = Math.round(height * scale);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const targetBytes = maxKB * 1024;
          let quality = 0.92;
          const minQuality = 0.5;
          let warned = false;

          function attempt() {
            try {
              const dataUrl = canvas.toDataURL('image/jpeg', quality);
              const size = Math.round((dataUrl.length * 3) / 4 / 1024);
              if (size <= maxKB || quality <= minQuality) {
                if (size > maxKB && quality <= minQuality) {
                  width = Math.max(64, Math.round(canvas.width * 0.85));
                  height = Math.max(64, Math.round(canvas.height * 0.85));
                  canvas.width = width;
                  canvas.height = height;
                  ctx.drawImage(img, 0, 0, width, height);
                  quality = 0.85;
                  warned = true;
                  return attempt();
                }
                resolve({ dataUrl, sizeKB: size, warned });
              } else {
                quality = Math.max(minQuality, quality - 0.12);
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

  function svgPlaceholder(initials = '') {
    const bg = '#061014';
    const fg = '#00ff9f';
    const text = initials || '';
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><rect width='100%' height='100%' fill='${bg}' rx='12' ry='12'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Courier New, monospace' font-size='48' fill='${fg}'>${text}</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function getDefaultAvatar(initials = '') {
    return DEFAULT_AVATAR;
  }

  function resetAvatar() {
    stagedAvatarDataUrl = '';
    const initials = (displayName.value || '').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
    avatarPreview.onerror = function () { avatarPreview.onerror = null; avatarPreview.src = svgPlaceholder(initials); };
    avatarPreview.src = getDefaultAvatar(initials);
    avatarInfo.textContent = 'Avatar cleared – save profile to persist.';
  }

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
    
    const storedUser = localStorage.getItem('currentUser') || localStorage.getItem('user');
    if (storedUser && window.supabase) {
      try {
        if (!db) db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        if (!currentUser) currentUser = JSON.parse(storedUser);
        let query = db.from('users');
        if (currentUser.id) query = query.update({ password: nw }).eq('id', currentUser.id).select().maybeSingle();
        else if (currentUser.username) query = query.update({ password: nw }).eq('username', currentUser.username).select().maybeSingle();
        if (query) {
          const { error } = query;
          if (error) throw error;
        }
      } catch (err) {
        console.warn('Failed to update remote password', err?.message || err);
      }
    }

    currentPassword.value = newPassword.value = confirmPassword.value = '';
    showMessage(pwdMsg, 'Password changed (demo only)', 'success');
  }

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

  function isValidEmail(val) {
    if (!val) return true;
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

  // Delete Account Functions
  function showDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('show');
      document.getElementById('confirmUsername').value = '';
      document.getElementById('confirmPasswordDel').value = '';
    }
  }

  function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
    }
  }

  async function deleteAccount() {
    const usernameInput = document.getElementById('confirmUsername');
    const passwordInput = document.getElementById('confirmPasswordDel');

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showToast('Please enter both username and password', 'error');
      return;
    }

    try {
      const storedUser = localStorage.getItem('currentUser') || localStorage.getItem('user');
      if (!storedUser) {
        showToast('No user session found', 'error');
        return;
      }

      const user = JSON.parse(storedUser);

      if (user.username && username !== user.username) {
        showToast('Username does not match your account', 'error');
        return;
      }

      const deleteBtn = document.getElementById('confirmDeleteBtn');
      const originalText = deleteBtn.textContent;
      deleteBtn.textContent = 'Deleting...';
      deleteBtn.disabled = true;

      const authResult = await verifyCredentials(user.username || username, password);

      if (!authResult.success) {
        showToast(authResult.error || 'Incorrect password. Account deletion cancelled.', 'error');
        deleteBtn.textContent = originalText;
        deleteBtn.disabled = false;
        return;
      }

      if (window.supabase) {
        try {
          if (!db) db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

          const { error } = await db
            .from('users')
            .delete()
            .eq('id', user.id);

          if (error) {
            console.error('Database deletion error:', error);
            throw error;
          }

          localStorage.removeItem(PROFILE_KEY);
          localStorage.removeItem('currentUser');
          localStorage.removeItem('user');

          showToast('Account deleted successfully. Redirecting...', 'success');

          setTimeout(() => {
            window.location.href = '/login-page/login-page.html';
          }, 2000);

        } catch (err) {
          console.error('Account deletion failed:', err);
          showToast('Failed to delete account from database', 'error');
          deleteBtn.textContent = originalText;
          deleteBtn.disabled = false;
        }
      } else {
        localStorage.removeItem(PROFILE_KEY);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('user');

        showToast('Account data cleared locally. Redirecting...', 'success');

        setTimeout(() => {
          window.location.href = '/login-page/login-page.html';
        }, 2000);
      }

    } catch (error) {
      console.error('Delete account error:', error);
      showToast('Account deletion failed: ' + (error.message || 'Unknown error'), 'error');
      const deleteBtn = document.getElementById('confirmDeleteBtn');
      deleteBtn.textContent = '🗑️ DELETE PERMANENTLY';
      deleteBtn.disabled = false;
    }
  }

  // Make functions globally accessible for HTML onclick handlers
  window.showDeleteModal = showDeleteModal;
  window.closeDeleteModal = closeDeleteModal;

  // Event wiring
  if (avatarInput) avatarInput.addEventListener('change', (e) => handleAvatarChange(e.target.files[0]));
  if (resetAvatarBtn) resetAvatarBtn.addEventListener('click', resetAvatar);
  if (saveProfileBtn) saveProfileBtn.addEventListener('click', saveProfile);
  if (resetProfileBtn) resetProfileBtn.addEventListener('click', resetProfile);
  if (changePwdBtn) changePwdBtn.addEventListener('click', (e) => { e.preventDefault(); changePassword(); });
  if (exportBtn) exportBtn.addEventListener('click', exportProfile);
  if (importBtn && importInput) importBtn.addEventListener('click', () => importInput.click());
  if (importInput) importInput.addEventListener('change', (e) => importProfileFile(e.target.files[0]));

  // Wire up delete account buttons
  const deleteBtn = document.getElementById('deleteAccountBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', showDeleteModal);
  }

  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', deleteAccount);
  }

  const deleteModal = document.getElementById('deleteModal');
  if (deleteModal) {
    deleteModal.addEventListener('click', function (e) {
      if (e.target === deleteModal) {
        closeDeleteModal();
      }
    });
  }

  const confirmUsername = document.getElementById('confirmUsername');
  const confirmPasswordDel = document.getElementById('confirmPasswordDel');

  if (confirmUsername && confirmPasswordDel) {
    const handleEnter = function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        deleteAccount();
      }
    };

    confirmUsername.addEventListener('keydown', handleEnter);
    confirmPasswordDel.addEventListener('keydown', handleEnter);
  }

  // init
  loadProfile();
})();

// Matrix Background - Keep outside IIFE since it's self-contained
(function () {
  const canvas = document.getElementById('matrixCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '1';
  canvas.style.pointerEvents = 'none';
  canvas.style.opacity = '0.08';

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initMatrix();
  }

  window.addEventListener('resize', resize, { passive: true });

  const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const fontSize = 18;
  let columns = 0;
  let drops = [];
  let speeds = [];

  function initMatrix() {
    columns = Math.floor(window.innerWidth / fontSize);
    drops = [];
    speeds = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -window.innerHeight;
      speeds[i] = Math.random() * 0.7 + 0.5;
    }
  }

  resize();

  function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00FF9F';
    ctx.font = `${fontSize}px 'Courier New', monospace`;

    for (let i = 0; i < columns; i++) {
      const x = i * fontSize;

      const charIndex = Math.floor(Math.random() * chars.length);
      ctx.fillText(chars[charIndex], x, drops[i]);

      const trailLength = Math.floor(Math.random() * 3) + 2;
      for (let j = 1; j <= trailLength; j++) {
        const y = drops[i] - (j * fontSize);
        if (y > 0) {
          const alpha = 0.7 - (j * 0.2);
          ctx.fillStyle = `rgba(0, 255, 159, ${alpha})`;
          const trailCharIndex = Math.floor(Math.random() * chars.length);
          ctx.fillText(chars[trailCharIndex], x, y);
        }
      }

      drops[i] += speeds[i];

      if (drops[i] > canvas.height + 100) {
        drops[i] = Math.random() * -100;
      }

      ctx.fillStyle = '#00FF9F';
    }
  }

  setInterval(draw, 40);
})();