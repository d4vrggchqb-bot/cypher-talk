// MATRIX MESSENGER - FINAL FIXED VERSION
console.log('🚀 Starting Matrix Messenger...');

// Global variables
let db = null; // We'll use 'db' instead of 'supabaseClient' for clarity
let currentUser = null;
let selectedUser = null;
let jointPasswordCheckInterval = null;
let currentJointPasswordRequest = null;

// ==================== CIPHER IMPLEMENTATIONS ====================

function playfairEncrypt(text, key) {
  const matrix = createPlayfairMatrix(key);
  text = text.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');

  const pairs = [];
  for (let i = 0; i < text.length; i += 2) {
    let a = text[i];
    let b = text[i + 1] || 'X';
    if (a === b) b = 'X';
    pairs.push([a, b]);
  }

  let result = '';
  for (const [a, b] of pairs) {
    const [row1, col1] = findPosition(matrix, a);
    const [row2, col2] = findPosition(matrix, b);

    if (row1 === row2) {
      result += matrix[row1 * 5 + (col1 + 1) % 5];
      result += matrix[row2 * 5 + (col2 + 1) % 5];
    } else if (col1 === col2) {
      result += matrix[((row1 + 1) % 5) * 5 + col1];
      result += matrix[((row2 + 1) % 5) * 5 + col2];
    } else {
      result += matrix[row1 * 5 + col2];
      result += matrix[row2 * 5 + col1];
    }
  }

  return result;
}

function playfairDecrypt(text, key) {
  const matrix = createPlayfairMatrix(key);
  text = text.toUpperCase().replace(/[^A-Z]/g, '');

  let result = '';
  for (let i = 0; i < text.length; i += 2) {
    const a = text[i];
    const b = text[i + 1];

    const [row1, col1] = findPosition(matrix, a);
    const [row2, col2] = findPosition(matrix, b);

    if (row1 === row2) {
      result += matrix[row1 * 5 + (col1 + 4) % 5];
      result += matrix[row2 * 5 + (col2 + 4) % 5];
    } else if (col1 === col2) {
      result += matrix[((row1 + 4) % 5) * 5 + col1];
      result += matrix[((row2 + 4) % 5) * 5 + col2];
    } else {
      result += matrix[row1 * 5 + col2];
      result += matrix[row2 * 5 + col1];
    }
  }

  return result;
}

function createPlayfairMatrix(key) {
  key = key.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
  const matrix = [];
  const used = new Set();
  const alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';

  for (const char of key) {
    if (!used.has(char)) {
      matrix.push(char);
      used.add(char);
    }
  }

  for (const char of alphabet) {
    if (!used.has(char)) {
      matrix.push(char);
    }
  }

  return matrix;
}

function findPosition(matrix, char) {
  const index = matrix.indexOf(char);
  return [Math.floor(index / 5), index % 5];
}

function vigenereEncrypt(text, key) {
  key = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (!key) return text;

  let result = '';
  let keyIndex = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char.match(/[a-z]/i)) {
      const code = char.charCodeAt(0);
      const base = code >= 65 && code <= 90 ? 65 : 97;
      const shift = key[keyIndex % key.length].charCodeAt(0) - 65;
      result += String.fromCharCode(((code - base + shift) % 26) + base);
      keyIndex++;
    } else {
      result += char;
    }
  }
  return result;
}

function vigenereDecrypt(text, key) {
  key = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (!key) return text;

  let result = '';
  let keyIndex = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char.match(/[a-z]/i)) {
      const code = char.charCodeAt(0);
      const base = code >= 65 && code <= 90 ? 65 : 97;
      const shift = key[keyIndex % key.length].charCodeAt(0) - 65;
      result += String.fromCharCode(((code - base - shift + 26) % 26) + base);
      keyIndex++;
    } else {
      result += char;
    }
  }
  return result;
}

function railfenceEncrypt(text, rails) {
  rails = parseInt(rails);
  if (rails < 2) rails = 2;

  const fence = Array(rails).fill('').map(() => []);
  let rail = 0;
  let direction = 1;

  for (const char of text) {
    fence[rail].push(char);
    rail += direction;

    if (rail === 0 || rail === rails - 1) {
      direction *= -1;
    }
  }

  return fence.flat().join('');
}

function railfenceDecrypt(text, rails) {
  rails = parseInt(rails);
  if (rails < 2) rails = 2;

  const fence = Array(rails).fill('').map(() => []);
  const pattern = [];
  let rail = 0;
  let direction = 1;

  for (let i = 0; i < text.length; i++) {
    pattern.push(rail);
    rail += direction;
    if (rail === 0 || rail === rails - 1) {
      direction *= -1;
    }
  }

  let index = 0;
  for (let r = 0; r < rails; r++) {
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === r) {
        fence[r].push(text[index++]);
      }
    }
  }

  let result = '';
  rail = 0;
  direction = 1;
  const indices = Array(rails).fill(0);

  for (let i = 0; i < text.length; i++) {
    result += fence[rail][indices[rail]++];
    rail += direction;
    if (rail === 0 || rail === rails - 1) {
      direction *= -1;
    }
  }

  return result;
}

function columnarEncrypt(text, key) {
  key = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (!key) return text;

  const numCols = key.length;
  const numRows = Math.ceil(text.length / numCols);

  const grid = [];
  let index = 0;
  for (let r = 0; r < numRows; r++) {
    const row = [];
    for (let c = 0; c < numCols; c++) {
      row.push(text[index++] || 'X');
    }
    grid.push(row);
  }

  const keyOrder = key.split('').map((char, i) => ({ char, i }))
    .sort((a, b) => a.char.localeCompare(b.char))
    .map(x => x.i);

  let result = '';
  for (const col of keyOrder) {
    for (const row of grid) {
      result += row[col];
    }
  }

  return result;
}

function columnarDecrypt(text, key) {
  key = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (!key) return text;

  const numCols = key.length;
  const numRows = Math.ceil(text.length / numCols);

  const keyOrder = key.split('').map((char, i) => ({ char, i }))
    .sort((a, b) => a.char.localeCompare(b.char))
    .map(x => x.i);

  const grid = Array(numRows).fill(0).map(() => Array(numCols).fill(''));

  let index = 0;
  for (const col of keyOrder) {
    for (let r = 0; r < numRows; r++) {
      grid[r][col] = text[index++] || '';
    }
  }

  let result = '';
  for (const row of grid) {
    result += row.join('');
  }

  return result.replace(/X+$/, '');
}

// Main initialization
async function initApp() {
  console.log('🔧 Initializing app...');

  try {
    // 1. Initialize database connection
    initDatabase();

    // 2. Check if user is logged in
    const userData = localStorage.getItem('currentUser') || localStorage.getItem('user');
    if (!userData) {
      alert('Please login first');
      window.location.href = 'index.html';
      return;
    }

    currentUser = JSON.parse(userData);
    console.log('👤 Current user:', currentUser.username);

    // 3. Update UI
    document.getElementById('user-info').textContent = `Logged in as: ${currentUser.username}`;

    // 4. Load users
    await loadUsers();

    // 5. Setup event listeners
    setupEventListeners();

    console.log('✅ App initialized successfully!');

  } catch (error) {
    console.error('❌ Initialization error:', error);
    alert('Error: ' + error.message);
  }
}

// Initialize database connection
function initDatabase() {
  console.log('🔌 Initializing database connection...');

  const SUPABASE_URL = 'https://ryehvditehqzslcvpdqz.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZWh2ZGl0ZWhxenNsY3ZwZHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NDQ5MjgsImV4cCI6MjA4MDQyMDkyOH0.u9g9RagPPboQTPnaMPXK9fppuQDyjIoL-idQsQI8ztw';

  // Create database client
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log('✅ Database client created');
  console.log('db.from is a function?', typeof db.from === 'function');
}

// Load other users
async function loadUsers() {
  console.log('📞 Loading users...');

  const list = document.getElementById('conversations-list');
  if (!list) {
    console.error('❌ Conversations list not found');
    return;
  }

  list.innerHTML = '<div class="no-conversations">Loading users...</div>';

  try {
    if (!db || typeof db.from !== 'function') {
      throw new Error('Database connection not ready');
    }

    const { data: users, error } = await db
      .from('users')
      .select('username')
      .order('username');

    if (error) throw error;

    console.log('📋 Raw users data:', users);

    const otherUsers = users.filter(u => {
      if (!u || !u.username) return false;
      return u.username !== currentUser.username;
    });

    console.log('👥 Other users after filter:', otherUsers);

    if (otherUsers.length === 0) {
      list.innerHTML = '<div class="no-conversations">No other users found</div>';
      return;
    }

    // Clear and create items
    list.innerHTML = '';

    otherUsers.forEach(user => {
      const item = document.createElement('div');
      item.className = 'conversation-item';
      item.textContent = user.username; // Simple text only
      item.dataset.username = user.username;

      list.appendChild(item);
    });

    // Add click listeners AFTER all items are added
    setTimeout(() => {
      document.querySelectorAll('.conversation-item').forEach(item => {
        item.onclick = function () {
          selectUser(this.dataset.username);
        };
      });
    }, 100);

    console.log(`✅ Created ${otherUsers.length} conversation items`);

    // Verify
    const createdItems = list.querySelectorAll('.conversation-item');
    createdItems.forEach((item, i) => {
      console.log(`Item ${i}: dataset.username = "${item.dataset.username}"`);
    });
    const deleteBtn = document.getElementById('delete-messages-btn');
    if (deleteBtn) {
      deleteBtn.style.display = 'none';
    }

  } catch (error) {
    console.error('❌ Error loading users:', error);
    list.innerHTML = '<div class="no-conversations">Error loading users</div>';
  }
}


// Select a user - UPDATED VERSION
function selectUser(username) {
  console.log('=== SELECT USER FUNCTION CALLED ===');
  console.log('Username parameter:', username);
  console.log('Type of username:', typeof username);

  if (!username || username === 'undefined' || username === 'null') {
    console.error('❌ Invalid username received:', username);
    alert('Error: Invalid user selection. Please try again.');
    return;
  }

  // Clean the username
  username = username.trim();

  // Set global variable
  selectedUser = username;
  console.log('✅ selectedUser variable set to:', selectedUser);
  console.log('window.selectedUser:', window.selectedUser);

  // Update UI - find the correct item
  let foundItem = false;
  document.querySelectorAll('.conversation-item').forEach(item => {
    const itemUsername = item.dataset.username || item.getAttribute('data-user');

    if (itemUsername === username) {
      item.classList.add('active');
      item.style.background = 'rgba(0, 255, 0, 0.15)';
      item.style.borderLeft = '3px solid #0f0';
      foundItem = true;
      console.log('✅ Found and highlighted matching item');
    } else {
      item.classList.remove('active');
      item.style.background = '';
      item.style.borderLeft = '';
    }
  });

  if (!foundItem) {
    console.warn('⚠️ Could not find matching item in DOM, but continuing...');
  }

  // Update chat header
  const chatTitle = document.getElementById('chat-title');
  if (chatTitle) {
    chatTitle.textContent = username;
    console.log('✅ Chat title updated to:', username);
  }

  // Update input placeholder
  const messageInput = document.getElementById('message-input');
  if (messageInput) {
    messageInput.placeholder = `Message ${username}...`;
  }

  console.log(`✅ Successfully selected user: ${username}`);

  const deleteBtn = document.getElementById('delete-messages-btn');
  const decryptAllBtn = document.getElementById('decrypt-all-btn');

  if (deleteBtn) {
    deleteBtn.style.display = 'block';
  }

  if (decryptAllBtn) {
    decryptAllBtn.style.display = 'block';
  }

  // Check for pending joint password requests
  setTimeout(() => checkForJointPasswordRequest(), 500);
  // Load messages
  loadMessages(username);
}
// Load messages
async function loadMessages(otherUser) {
  console.log(`📨 Loading messages with ${otherUser}`);

  const container = document.getElementById('messages-container');
  if (!container) return;

  container.innerHTML = '<div class="no-messages">Loading messages...</div>';

  try {
    if (!db || typeof db.from !== 'function') {
      throw new Error('Database connection not ready');
    }

    const { data: messages, error } = await db
      .from('messages')
      .select('*')
      .or(`and(sender_username.eq.${currentUser.username},recipient_username.eq.${otherUser}),and(sender_username.eq.${otherUser},recipient_username.eq.${currentUser.username})`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!messages || messages.length === 0) {
      container.innerHTML = `
                <div class="no-messages">
                    No messages yet. Start chatting!
                    <div class="hint">Type a message below and click "Encrypt & Send"</div>
                </div>
            `;
      return;
    }

    // Display messages
    container.innerHTML = '';
    messages.forEach(msg => {
      const isSent = msg.sender_username === currentUser.username;
      const time = new Date(msg.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });

      const div = document.createElement('div');
      div.className = `message ${isSent ? 'sent' : ''}`;
      div.innerHTML = `
                <div class="message-avatar">${msg.sender_username.charAt(0).toUpperCase()}</div>
                <div class="message-content">
                    <div class="message-bubble" data-cipher="${msg.cipher_type}" data-key="${msg.encryption_key}">
                        <div class="encrypted-text">${msg.encrypted_content}</div>
                        <span class="cipher-label">🔒 ${msg.cipher_type}</span>
                    </div>
                    <div class="message-time">${time}</div>
                </div>
            `;

      container.appendChild(div);
    });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;

  } catch (error) {
    console.error('❌ Error loading messages:', error);
    container.innerHTML = '<div class="no-messages">Error loading messages</div>';
  }
}

// Send message - CORRECTED VERSION
async function sendMessage() {
  console.log('📤 Attempting to send message...');
  console.log('Current selectedUser:', selectedUser);

  // Check if user is selected
  if (!selectedUser) {
    alert('❌ Please select a user first!\n\nClick on a user from the left sidebar to start chatting.');

    // Highlight the conversations list to guide user
    const list = document.getElementById('conversations-list');
    if (list) {
      list.style.border = '2px solid #f00';
      list.style.boxShadow = '0 0 10px #f00';
      setTimeout(() => {
        list.style.border = '';
        list.style.boxShadow = '';
      }, 2000);
    }
    return;
  }

  // Check if database client is ready
  if (!db || typeof db.from !== 'function') {
    console.error('❌ Database client not ready:', db);
    alert('Error: Database connection not ready. Please refresh the page.');
    return;
  }

  // Get input values
  const messageInput = document.getElementById('message-input');
  const cipherSelect = document.getElementById('cipher-select');
  const keyInput = document.getElementById('key-input');

  const text = messageInput.value.trim();
  const cipherType = cipherSelect.value;
  const key = keyInput.value.trim();

  // Validation
  if (!text) {
    alert('Please enter a message');
    return;
  }

  if (!key) {
    alert('Please enter a cipher key');
    return;
  }

  try {
    console.log('Encrypting message...');

    // Encrypt the message
    let encrypted = text;

    switch (cipherType) {
      case 'Shift':
        const shift = parseInt(key);
        if (isNaN(shift)) {
          alert('Key must be a number for Shift cipher');
          return;
        }
        encrypted = text.split('').map(char => {
          if (char >= 'A' && char <= 'Z') {
            let code = char.charCodeAt(0) - 'A'.charCodeAt(0);
            code = (code + shift) % 26;
            if (code < 0) code += 26;
            return String.fromCharCode('A'.charCodeAt(0) + code);
          } else if (char >= 'a' && char <= 'z') {
            let code = char.charCodeAt(0) - 'a'.charCodeAt(0);
            code = (code + shift) % 26;
            if (code < 0) code += 26;
            return String.fromCharCode('a'.charCodeAt(0) + code);
          }
          return char;
        }).join('');
        break;

      case 'Vigenere':
        encrypted = vigenereEncrypt(text, key);
        break;

      case 'Playfair':
        encrypted = playfairEncrypt(text, key);
        break;

      case 'Railfence':
        const rails = parseInt(key);
        if (isNaN(rails) || rails < 2) {
          alert('Key must be a number ≥ 2 for Rail Fence cipher');
          return;
        }
        encrypted = railfenceEncrypt(text, rails);
        break;

      case 'Columnar':
        encrypted = columnarEncrypt(text, key);
        break;

      default:
        encrypted = text;
    }

    console.log('Sending to database...');
    console.log('From:', currentUser.username);
    console.log('To:', selectedUser);
    console.log('Message:', encrypted.substring(0, 50) + '...');

    // Send to database - USING 'db' NOT 'supabase'
    const { data, error } = await db
      .from('messages')
      .insert({
        sender_username: currentUser.username,
        recipient_username: selectedUser,
        cipher_type: cipherType,
        encryption_key: key,
        encrypted_content: encrypted,
        decrypted_content: text,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    console.log('✅ Message sent successfully:', data);

    // Clear inputs
    messageInput.value = '';
    keyInput.value = '';

    // Instead of reloading ALL messages, just append the new one
    // Clear "no messages" placeholder if it exists
    const container = document.getElementById('messages-container');
    const noMessages = container.querySelector('.no-messages');
    if (noMessages) {
      container.innerHTML = '';
    }

    // Append the new message
    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    const div = document.createElement('div');
    div.className = 'message sent';
    div.innerHTML = `
  <div class="message-avatar">${currentUser.username.charAt(0).toUpperCase()}</div>
  <div class="message-content">
    <div class="message-bubble" data-cipher="${cipherType}" data-key="${key}">
      <div class="encrypted-text">${encrypted}</div>
      <span class="cipher-label">🔒 ${cipherType}</span>
    </div>
    <div class="message-time">${time}</div>
  </div>
`;

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

  } catch (error) {
    console.error('❌ Send error:', error);
    alert('Failed to send message: ' + error.message);
  }
}

// ==================== JOINT PASSWORD FUNCTIONS ====================

// Simple hash function (in production, use proper hashing)
function simpleHash(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// Get joint password record
async function getJointPassword(user1, user2) {
  try {
    const users = [user1, user2].sort();

    const { data, error } = await db
      .from('joint_passwords')
      .select('*')
      .or(`and(user1_username.eq.${users[0]},user2_username.eq.${users[1]}),and(user1_username.eq.${users[1]},user2_username.eq.${users[0]})`)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error getting joint password:', error);
    return null;
  }
}

// Show joint password setup dialog
async function showDecryptAllDialog() {
  if (!selectedUser) {
    alert('No user selected');
    return;
  }

  // Check if joint password already exists
  const existingPassword = await getJointPassword(currentUser.username, selectedUser);

  if (existingPassword && existingPassword.status === 'active') {
    // Password exists, show decrypt dialog
    document.getElementById('decrypt-all-modal').style.display = 'flex';
    document.getElementById('decrypt-all-password-input').value = '';
    document.getElementById('decrypt-all-result').classList.remove('show', 'success', 'error');
    document.getElementById('decrypt-all-password-input').focus();
  } else {
    // No password, show setup dialog
    showJointPasswordModal();
  }
}

// Show joint password modal
function showJointPasswordModal() {
  const modal = document.getElementById('joint-password-modal');
  document.getElementById('password-input-section').style.display = 'block';
  document.getElementById('waiting-section').style.display = 'none';
  document.getElementById('request-section').style.display = 'none';
  document.getElementById('joint-password-input').value = '';
  modal.style.display = 'flex';
  document.getElementById('joint-password-input').focus();
}

// Submit joint password (initiator)
async function submitJointPassword() {
  const password = document.getElementById('joint-password-input').value.trim();

  if (!password) {
    alert('Please enter a password');
    return;
  }

  if (password.length < 4) {
    alert('Password must be at least 4 characters');
    return;
  }

  try {
    const users = [currentUser.username, selectedUser].sort();
    const passwordHash = simpleHash(password);

    // Insert or update joint password request
    const { data, error } = await db
      .from('joint_passwords')
      .upsert({
        user1_username: users[0],
        user2_username: users[1],
        password_hash: passwordHash,
        status: 'pending',
        initiated_by: currentUser.username,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user1_username,user2_username'
      })
      .select()
      .single();

    if (error) throw error;

    // Show waiting screen
    document.getElementById('password-input-section').style.display = 'none';
    document.getElementById('waiting-section').style.display = 'block';
    document.getElementById('waiting-for-user').textContent = selectedUser;

    // Start polling for response
    startJointPasswordPolling();

  } catch (error) {
    console.error('Error submitting joint password:', error);
    alert('Error: ' + error.message);
  }
}

// Start polling for joint password response
function startJointPasswordPolling() {
  if (jointPasswordCheckInterval) {
    clearInterval(jointPasswordCheckInterval);
  }

  jointPasswordCheckInterval = setInterval(async () => {
    const passwordData = await getJointPassword(currentUser.username, selectedUser);

    if (passwordData) {
      if (passwordData.status === 'active') {
        clearInterval(jointPasswordCheckInterval);
        closeJointPasswordModal();
        alert('✅ Joint password established successfully!');
      } else if (passwordData.status === 'declined') {
        clearInterval(jointPasswordCheckInterval);
        closeJointPasswordModal();
        alert('❌ ' + selectedUser + ' declined the joint password request.');
      }
    }
  }, 2000);
}

// Cancel joint password request
async function cancelJointPassword() {
  if (jointPasswordCheckInterval) {
    clearInterval(jointPasswordCheckInterval);
  }

  try {
    const users = [currentUser.username, selectedUser].sort();

    await db
      .from('joint_passwords')
      .delete()
      .eq('user1_username', users[0])
      .eq('user2_username', users[1]);

    closeJointPasswordModal();
  } catch (error) {
    console.error('Error canceling request:', error);
  }
}

// Check for pending joint password requests
async function checkForJointPasswordRequest() {
  if (!selectedUser) return;

  const passwordData = await getJointPassword(currentUser.username, selectedUser);

  if (passwordData && passwordData.status === 'pending' && passwordData.initiated_by !== currentUser.username) {
    // Show request dialog
    currentJointPasswordRequest = passwordData;
    const modal = document.getElementById('joint-password-modal');
    document.getElementById('password-input-section').style.display = 'none';
    document.getElementById('waiting-section').style.display = 'none';
    document.getElementById('request-section').style.display = 'block';
    document.getElementById('requesting-user').textContent = passwordData.initiated_by;
    document.getElementById('joint-password-response-input').value = '';
    modal.style.display = 'flex';
    document.getElementById('joint-password-response-input').focus();
  }
}

// Accept joint password
async function acceptJointPassword() {
  const password = document.getElementById('joint-password-response-input').value.trim();

  if (!password) {
    alert('Please enter the password');
    return;
  }

  const passwordHash = simpleHash(password);

  if (passwordHash !== currentJointPasswordRequest.password_hash) {
    alert('❌ Wrong password! Failed to establish joint password.\n\nYou can still access the messages.');
    closeJointPasswordModal();
    return;
  }

  try {
    // Update status to active
    const { error } = await db
      .from('joint_passwords')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', currentJointPasswordRequest.id);

    if (error) throw error;

    closeJointPasswordModal();
    alert('✅ Joint password established successfully!');
    currentJointPasswordRequest = null;

  } catch (error) {
    console.error('Error accepting password:', error);
    alert('Error: ' + error.message);
  }
}

// Decline joint password
async function declineJointPassword() {
  try {
    // Update status to declined
    const { error } = await db
      .from('joint_passwords')
      .update({
        status: 'declined',
        updated_at: new Date().toISOString()
      })
      .eq('id', currentJointPasswordRequest.id);

    if (error) throw error;

    closeJointPasswordModal();
    alert('Joint password request declined.');
    currentJointPasswordRequest = null;

  } catch (error) {
    console.error('Error declining password:', error);
    alert('Error: ' + error.message);
  }
}

// Close joint password modal
function closeJointPasswordModal() {
  if (jointPasswordCheckInterval) {
    clearInterval(jointPasswordCheckInterval);
  }
  document.getElementById('joint-password-modal').style.display = 'none';
}

// Close decrypt all modal
function closeDecryptAllModal() {
  document.getElementById('decrypt-all-modal').style.display = 'none';
}

// Decrypt all messages
async function decryptAllMessages() {
  const password = document.getElementById('decrypt-all-password-input').value.trim();
  const resultDiv = document.getElementById('decrypt-all-result');

  if (!password) {
    resultDiv.textContent = '❌ Please enter the password';
    resultDiv.classList.add('show', 'error');
    resultDiv.classList.remove('success');
    return;
  }

  const passwordHash = simpleHash(password);
  const passwordData = await getJointPassword(currentUser.username, selectedUser);

  if (!passwordData || passwordData.status !== 'active') {
    resultDiv.textContent = '❌ No active joint password found';
    resultDiv.classList.add('show', 'error');
    resultDiv.classList.remove('success');
    return;
  }

  if (passwordHash !== passwordData.password_hash) {
    resultDiv.textContent = '❌ Incorrect password';
    resultDiv.classList.add('show', 'error');
    resultDiv.classList.remove('success');
    return;
  }

  // Password is correct, decrypt all messages
  const bubbles = document.querySelectorAll('.message-bubble');
  let decryptedCount = 0;

  bubbles.forEach(bubble => {
    const encryptedText = bubble.querySelector('.encrypted-text').textContent;
    const cipherType = bubble.dataset.cipher;
    const key = bubble.dataset.key;

    try {
      let decrypted = encryptedText;

      switch (cipherType) {
        case 'Shift':
          const shift = parseInt(key);
          decrypted = encryptedText.split('').map(char => {
            if (char >= 'A' && char <= 'Z') {
              let code = char.charCodeAt(0) - 'A'.charCodeAt(0);
              code = (code - shift) % 26;
              if (code < 0) code += 26;
              return String.fromCharCode('A'.charCodeAt(0) + code);
            } else if (char >= 'a' && char <= 'z') {
              let code = char.charCodeAt(0) - 'a'.charCodeAt(0);
              code = (code - shift) % 26;
              if (code < 0) code += 26;
              return String.fromCharCode('a'.charCodeAt(0) + code);
            }
            return char;
          }).join('');
          break;
        case 'Vigenere':
          decrypted = vigenereDecrypt(encryptedText, key);
          break;
        case 'Playfair':
          decrypted = playfairDecrypt(encryptedText, key);
          break;
        case 'Railfence':
          decrypted = railfenceDecrypt(encryptedText, parseInt(key));
          break;
        case 'Columnar':
          decrypted = columnarDecrypt(encryptedText, key);
          break;
      }

      // Add decrypted text below the bubble
      const existingDecrypted = bubble.parentElement.querySelector('.decrypted-all-text');
      if (!existingDecrypted) {
        const decryptedDiv = document.createElement('div');
        decryptedDiv.className = 'decrypted-all-text';
        decryptedDiv.innerHTML = `<strong>Decrypted:</strong> ${decrypted}`;
        bubble.parentElement.appendChild(decryptedDiv);
        decryptedCount++;
      }

    } catch (error) {
      console.error('Error decrypting message:', error);
    }
  });

  resultDiv.textContent = `✅ Successfully decrypted ${decryptedCount} message(s)!`;
  resultDiv.classList.add('show', 'success');
  resultDiv.classList.remove('error');

  setTimeout(() => {
    closeDecryptAllModal();
  }, 2000);
}

// Make functions globally accessible
window.showDecryptAllDialog = showDecryptAllDialog;
window.submitJointPassword = submitJointPassword;
window.acceptJointPassword = acceptJointPassword;
window.declineJointPassword = declineJointPassword;
window.cancelJointPassword = cancelJointPassword;
window.closeJointPasswordModal = closeJointPasswordModal;
window.closeDecryptAllModal = closeDecryptAllModal;
window.decryptAllMessages = decryptAllMessages;

// Setup event listeners
function setupEventListeners() {
  console.log('🔧 Setting up event listeners...');

  // Send button - remove any existing listeners first
  const sendBtn = document.querySelector('.send-button');
  if (sendBtn) {
    // Clone the button to remove all existing event listeners
    const newBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newBtn, sendBtn);

    // Add single click listener
    newBtn.addEventListener('click', sendMessage);
    console.log('✅ Send button listener added');
  }

  // Enter key in message input
  const messageInput = document.getElementById('message-input');
  if (messageInput) {
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault(); // Prevent form submission
        sendMessage();
      }
    });
  }

  // Search box
  const searchBox = document.getElementById('search-box');
  if (searchBox) {
    searchBox.addEventListener('input', function () {
      const term = this.value.toLowerCase();
      document.querySelectorAll('.conversation-item').forEach(item => {
        const username = item.dataset.username.toLowerCase();
        item.style.display = username.includes(term) ? 'flex' : 'none';
      });
    });
  }

  // Delete all messages
  // Delete conversation with current user
  window.deleteConversation = async function () {
    if (!selectedUser) {
      alert('No conversation selected');
      return;
    }

    if (!confirm(`Delete all messages with ${selectedUser}?`)) return;

    try {
      if (!db) throw new Error('Database not connected');

      const { error } = await db
        .from('messages')
        .delete()
        .or(`and(sender_username.eq.${currentUser.username},recipient_username.eq.${selectedUser}),and(sender_username.eq.${selectedUser},recipient_username.eq.${currentUser.username})`);

      if (error) throw error;

      alert('✅ Conversation deleted!');

      // Clear messages display
      const container = document.getElementById('messages-container');
      if (container) {
        container.innerHTML = `
          <div class="no-messages">
            All messages deleted
            <div class="hint">Start a new conversation!</div>
          </div>
        `;
      }

    } catch (error) {
      console.error('❌ Delete error:', error);
      alert('Error: ' + error.message);
    }
  };

  // Logout
  window.logout = function () {
    console.log('🚪 Logging out...');

    localStorage.removeItem('currentUser');
    localStorage.removeItem('user');

    // Use absolute path
    window.location.href = '/login-page/index.html';
  };

  console.log('✅ Event listeners setup complete');
}

// Make sendMessage available globally
window.sendMessage = sendMessage;

// Start the app when page loads
document.addEventListener('DOMContentLoaded', function () {
  console.log('📄 DOM Content Loaded');
  setTimeout(initApp, 100);
});

// Context menu and decrypt functionality
let currentMessageBubble = null;

// Add right-click listener to messages
document.addEventListener('contextmenu', function (e) {
  const bubble = e.target.closest('.message-bubble');
  if (bubble) {
    e.preventDefault();
    currentMessageBubble = bubble;
    showDecryptModal(bubble);
  }
});

function showDecryptModal(bubble) {
  const popup = document.getElementById('decrypt-popup');
  const encryptedText = bubble.querySelector('.encrypted-text').textContent;
  const cipherType = bubble.dataset.cipher;

  // Store data for decryption
  popup.dataset.encryptedText = encryptedText;
  popup.dataset.cipherType = cipherType;

  // Clear previous state
  document.getElementById('decrypt-key-input').value = '';
  document.getElementById('decrypt-result').textContent = '';
  document.getElementById('decrypt-result').classList.remove('show', 'error');

  // Position popup next to the message
  const rect = bubble.getBoundingClientRect();
  popup.style.display = 'block';
  popup.style.left = (rect.right + 10) + 'px';
  popup.style.top = rect.top + 'px';

  // Adjust if popup goes off screen
  setTimeout(() => {
    const popupRect = popup.getBoundingClientRect();
    if (popupRect.right > window.innerWidth) {
      popup.style.left = (rect.left - popupRect.width - 10) + 'px';
    }
    if (popupRect.bottom > window.innerHeight) {
      popup.style.top = (window.innerHeight - popupRect.height - 10) + 'px';
    }
  }, 10);

  // Focus input
  document.getElementById('decrypt-key-input').focus();
}

function closeDecryptModal() {
  const popup = document.getElementById('decrypt-popup');
  popup.style.display = 'none';
  currentMessageBubble = null;
}

function decryptMessage() {
  const key = document.getElementById('decrypt-key-input').value.trim();
  const resultDiv = document.getElementById('decrypt-result');
  const popup = document.getElementById('decrypt-popup');

  if (!key) {
    resultDiv.textContent = '❌ Enter a key';
    resultDiv.classList.add('show', 'error');
    return;
  }

  const encryptedText = popup.dataset.encryptedText;
  const cipherType = popup.dataset.cipherType;

  try {
    let decrypted = encryptedText;

    switch (cipherType) {
      case 'Shift':
        const shift = parseInt(key);
        if (isNaN(shift)) {
          throw new Error('Key must be a number');
        }
        decrypted = encryptedText.split('').map(char => {
          if (char >= 'A' && char <= 'Z') {
            let code = char.charCodeAt(0) - 'A'.charCodeAt(0);
            code = (code - shift) % 26;
            if (code < 0) code += 26;
            return String.fromCharCode('A'.charCodeAt(0) + code);
          } else if (char >= 'a' && char <= 'z') {
            let code = char.charCodeAt(0) - 'a'.charCodeAt(0);
            code = (code - shift) % 26;
            if (code < 0) code += 26;
            return String.fromCharCode('a'.charCodeAt(0) + code);
          }
          return char;
        }).join('');
        break;

      case 'Vigenere':
        decrypted = vigenereDecrypt(encryptedText, key);
        break;

      case 'Playfair':
        decrypted = playfairDecrypt(encryptedText, key);
        break;

      case 'Railfence':
        const rails = parseInt(key);
        if (isNaN(rails) || rails < 2) {
          throw new Error('Key must be a number ≥ 2');
        }
        decrypted = railfenceDecrypt(encryptedText, rails);
        break;

      case 'Columnar':
        decrypted = columnarDecrypt(encryptedText, key);
        break;

      default:
        decrypted = encryptedText;
    }

    resultDiv.textContent = '✅ ' + decrypted;
    resultDiv.classList.add('show');
    resultDiv.classList.remove('error');

  } catch (error) {
    resultDiv.textContent = '❌ ' + error.message;
    resultDiv.classList.add('show', 'error');
  }
}

// Make functions globally accessible
window.closeDecryptModal = closeDecryptModal;
window.decryptMessage = decryptMessage;
console.log('✅ Messenger script loaded successfully');