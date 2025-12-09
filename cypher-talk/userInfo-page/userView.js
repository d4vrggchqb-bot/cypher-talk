// userView.js — simple read-only viewer that reads the saved profile
(function(){
  const PROFILE_KEY = 'ct_userProfile';
  const avatar = document.getElementById('viewerAvatar');
  const display = document.getElementById('viewerDisplay');
  const firstlast = document.getElementById('viewerFirstLast');
  const email = document.getElementById('viewerEmail');
  const desc = document.getElementById('viewerDescription');
  const nameTitle = document.getElementById('viewerName');

  function svgPlaceholder(initials = ''){
    const bg = '#061014';
    const fg = '#00ff9f';
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><rect width='100%' height='100%' fill='${bg}' rx='12' ry='12'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Courier New, monospace' font-size='48' fill='${fg}'>${initials}</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function populateFromObject(p){
    if (!p) return;
    display.textContent = p.displayName || '';
    const fn = p.firstName || '';
    const ln = p.lastName || '';
    firstlast.textContent = (fn || ln) ? `${fn} ${ln}`.trim() : '';
    email.textContent = p.email || '';
    desc.textContent = p.description || '';
    nameTitle.textContent = p.displayName || (fn || ln ? `${fn} ${ln}`.trim() : '');

    if (p.avatar) {
      avatar.onerror = function(){ avatar.onerror=null; avatar.src = svgPlaceholder((p.displayName||'').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase()); };
      avatar.src = p.avatar;
    } else {
      const initials = (p.displayName || '').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
      avatar.src = svgPlaceholder(initials);
    }
  }

  // Try localStorage first
  function loadLocal(){
    const raw = localStorage.getItem(PROFILE_KEY);
    const p = raw ? JSON.parse(raw) : null;
    if (p) populateFromObject(p);
  }

  // --- Supabase remote fetch support ---
  const SUPABASE_URL = 'https://ryehvditehqzslcvpdqz.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZWh2ZGl0ZWhxenNsY3ZwZHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NDQ5MjgsImV4cCI6MjA4MDQyMDkyOH0.u9g9RagPPboQTPnaMPXK9fppuQDyjIoL-idQsQI8ztw';

  async function loadRemoteByIdOrUsername(id, username){
    if (!window.supabase) return null;
    try{
      const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      let query = db.from('users').select('*');
      if (id) query = query.eq('id', id).maybeSingle();
      else if (username) query = query.eq('username', username).maybeSingle();
      else return null;
      const { data, error } = await query;
      if (error) { console.warn('Supabase fetch error', error); return null; }
      return data || null;
    }catch(err){ console.warn('Supabase fetch failed', err); return null; }
  }

  // If query param present, try remote fetch. Otherwise try to use local storage or currentUser
  (async function tryLoad(){
    // parse query params ?id= or ?username=
    const qp = new URLSearchParams(window.location.search);
    const id = qp.get('id');
    const username = qp.get('username');

    // attempt remote first if possible
    let remote = null;
    if ((id || username) && window.supabase) {
      remote = await loadRemoteByIdOrUsername(id, username);
    }

    // If no id/username passed, try currentUser in localStorage
    if (!remote) {
      const storedUser = localStorage.getItem('currentUser') || localStorage.getItem('user');
      if (storedUser && window.supabase) {
        try{
          const cu = JSON.parse(storedUser);
          if (cu.id || cu.username) remote = await loadRemoteByIdOrUsername(cu.id, cu.username);
        }catch(e){/*ignore*/}
      }
    }

    if (remote) {
      // Map remote columns to our expected keys
      const mapped = {
        displayName: remote.display_name || remote.username || '',
        firstName: remote.first_name || '',
        lastName: remote.last_name || '',
        email: remote.email || '',
        description: remote.description || '',
        avatar: remote.avatar || ''
      };
      populateFromObject(mapped);
      // also keep a local copy to allow quick view later
      localStorage.setItem(PROFILE_KEY, JSON.stringify(Object.assign({}, mapped)));
      return;
    }

    // Fallback to local
    loadLocal();
  })();

  // live local updates
  window.addEventListener('storage', (e) => { if (e.key === PROFILE_KEY) loadLocal(); });

})();
