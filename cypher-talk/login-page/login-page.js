// Supabase configuration
const SUPABASE_URL = 'https://ryehvditehqzslcvpdqz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZWh2ZGl0ZWhxenNsY3ZwZHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NDQ5MjgsImV4cCI6MjA4MDQyMDkyOH0.u9g9RagPPboQTPnaMPXK9fppuQDyjIoL-idQsQI8ztw';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Authentication service
const AuthService = {
    async signUp(username, password, email, securityQuestion = null, securityAnswer = null) {
        try {
            console.log('=== SIGNUP DEBUG START ===');
            console.log('Parameters:', { username, password, email, securityQuestion, securityAnswer });

            // If email is same as username (no @), add @matrix.com
            let finalEmail = email;
            if (email === username && !email.includes('@')) {
                finalEmail = `${email}@matrix.com`;
            }

            // Prepare user data object
            const userData = {
                username: username.trim(),
                password: password,
                email: finalEmail.trim()
            };

            // Add optional fields if provided
            if (securityQuestion) {
                userData.security_question = securityQuestion;
            }
            if (securityAnswer) {
                userData.security_answer = securityAnswer;
            }

            console.log('Inserting user data:', userData);

            const { data, error } = await supabase
                .from('users')
                .insert(userData)
                .select()
                .single();

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }

            console.log('User created successfully:', data);

            // Store session in localStorage
            localStorage.setItem('user', JSON.stringify({
                id: data.id,
                username: data.username,
                loggedIn: true
            }));
            console.log('User created successfully:', data);
            console.log('=== SIGNUP DEBUG END ===');

            return { success: true, user: data };
        } catch (error) {
            console.log('=== SIGNUP DEBUG ERROR ===');
            console.error('Full error:', error);
            console.error('Error details:', {
                message: error.message,
                name: error.name,
                code: error.code,
                details: error.details,
                hint: error.hint
            });

            let errorMessage = error.message || 'Account creation failed';

            // Check for specific Supabase errors
            if (error.code === '23505') {
                errorMessage = 'Username or email already exists';
            } else if (error.code === '42501') {
                errorMessage = 'Database permission denied';
            } else if (error.code === 'PGRST116') {
                errorMessage = 'No rows returned';
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    },

    async signIn(username, password) {
        try {
            console.log('=== SIGNIN DEBUG START ===');
            console.log('Username:', username);
            console.log('Password:', password);

            // Check if user exists
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .single();

            console.log('Query result:', user);
            console.log('Query error:', error);

            if (error) {
                console.log('Error in query:', error.message);
                throw new Error('Invalid username or password');
            }

            if (!user) {
                console.log('No user found');
                throw new Error('User not found');
            }

            console.log('Found user:', user);
            console.log('Expected password:', user.password);
            console.log('Provided password:', password);
            console.log('Password match:', user.password === password);

            // Check password
            if (user.password !== password) {
                console.log('Password mismatch!');
                throw new Error('Invalid username or password');
            }

            console.log('Login successful!');

            // Store session
            localStorage.setItem('user', JSON.stringify({
                id: user.id,
                username: user.username,
                loggedIn: true
            }));

            return { success: true, user };
        } catch (error) {
            console.log('=== SIGNIN DEBUG END WITH ERROR ===');
            console.error('Signin failed:', error);
            return { success: false, error: error.message };
        }
    },

    async checkUsernameAvailability(username) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('username')
                .eq('username', username)
                .maybeSingle(); // Use maybeSingle instead of single

            // If data exists, username is taken
            // If no data, username is available
            return {
                available: !data,
                error: error && error.code !== 'PGRST116' ? error.message : null
            };
        } catch (error) {
            return { available: false, error: error.message };
        }
    }
};

// Check username availability with Supabase
async function checkUsernameAvailability(username) {
    const statusElement = document.getElementById('username-status');

    // Clear previous status
    statusElement.textContent = 'Checking...';
    statusElement.className = 'username-availability';

    if (username.length < 3) {
        statusElement.textContent = 'Username must be at least 3 characters';
        statusElement.className = 'username-availability taken';
        return false;
    }

    try {
        // Check against Supabase
        const result = await AuthService.checkUsernameAvailability(username);

        if (result.available) {
            statusElement.textContent = '✓ Username available';
            statusElement.className = 'username-availability available';
            return true;
        } else {
            statusElement.textContent = '✗ Username already taken';
            statusElement.className = 'username-availability taken';
            return false;
        }
    } catch (error) {
        statusElement.textContent = 'Error checking username';
        statusElement.className = 'username-availability taken';
        return false;
    }
}

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        // User is already logged in, redirect to main page
        window.location.href = 'main.html';
    }
});
// Matrix rain effect
const canvas = document.getElementById('matrix-bg');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789';
const fontSize = 16;
const columns = canvas.width / fontSize;
const drops = Array(Math.floor(columns)).fill(1);

function drawMatrix() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0f0';
    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

let modalCanvas, modalCtx;
let modalAnimationId;

function initializeModalMatrix() {
    modalCanvas = document.getElementById('matrix-bg-modal');
    modalCtx = modalCanvas.getContext('2d');

    modalCanvas.width = window.innerWidth;
    modalCanvas.height = window.innerHeight;

    const modalChars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789';
    const modalFontSize = 14;
    const modalColumns = modalCanvas.width / modalFontSize;
    const modalDrops = Array(Math.floor(modalColumns)).fill(1);

    function drawModalMatrix() {
        modalCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        modalCtx.fillRect(0, 0, modalCanvas.width, modalCanvas.height);

        modalCtx.fillStyle = '#0f0';
        modalCtx.font = modalFontSize + 'px monospace';

        for (let i = 0; i < modalDrops.length; i++) {
            const text = modalChars[Math.floor(Math.random() * modalChars.length)];
            modalCtx.fillText(text, i * modalFontSize, modalDrops[i] * modalFontSize);

            if (modalDrops[i] * modalFontSize > modalCanvas.height && Math.random() > 0.975) {
                modalDrops[i] = 0;
            }
            modalDrops[i]++;
        }

        modalAnimationId = requestAnimationFrame(drawModalMatrix);
    }

    drawModalMatrix();
}

setInterval(drawMatrix, 33);

// Glitch text animation
const title = document.getElementById('glitch-title');
const finalText = 'LOGIN';
const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
let currentIndex = 0;

function glitchText() {
    if (currentIndex < finalText.length) {
        let displayText = finalText.substring(0, currentIndex);

        // Add glitching characters for remaining positions
        for (let i = currentIndex; i < finalText.length; i++) {
            displayText += glitchChars[Math.floor(Math.random() * glitchChars.length)];
        }

        title.textContent = displayText;
    } else {
        title.textContent = finalText;
        clearInterval(glitchInterval);
    }
}

// Run glitch effect multiple times per character
let glitchCount = 0;
const glitchInterval = setInterval(() => {
    glitchText();
    glitchCount++;

    if (glitchCount % 8 === 0) {
        currentIndex++;
    }
}, 50);

// Handle login form submission
async function handleSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Simple validation
    if (username.trim() === '' || password.trim() === '') {
        showAlert('Please enter both username and password', 'error');
        return false;
    }

    // Show loading
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;

    // Use Supabase authentication
    const result = await AuthService.signIn(username, password);

    if (result.success) {
        showAlert(`Link secured. Stay quiet...they're listening,  ${username}...`, 'success');

        // Store user info in localStorage
        localStorage.setItem('currentUser', JSON.stringify({
            id: result.user.id,
            username: result.user.username,
            email: result.user.email
        }));

        console.log('✅ Login successful! User stored:', {
            id: result.user.id,
            username: result.user.username,
            email: result.user.email
        });

        // Redirect to main page after a delay
        setTimeout(() => {
            window.location.href = '/messages-page/main.html'; // Change to your actual path
        }, 1500);
    } else {
        showAlert(`Login failed: ${result.error}`, 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }

    return false;
}

// Create account functionality
function createAccount() {
    const modal = document.getElementById('account-modal');
    modal.classList.add('show');

    // Initialize modal matrix if not already done
    if (!modalCanvas) {
        initializeModalMatrix();
    }

    // Clear previous inputs
    document.getElementById('new-username').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    document.getElementById('email').value = '';
    document.getElementById('security-question').value = '';
    document.getElementById('security-answer').value = '';
    document.getElementById('terms').checked = false;

    // Reset status indicators
    document.getElementById('username-status').textContent = '';
    document.getElementById('username-status').className = 'username-availability';
    document.getElementById('password-match').textContent = '';
    document.getElementById('password-strength').className = 'password-strength';
    document.querySelector('.strength-bar').style.width = '0%';
    document.querySelector('.strength-text').textContent = 'Password Strength';
}

// Anonymous sign-in: attempts to create a temporary guest user in the DB,
// falls back to a local-only guest session if DB insert fails.
async function signInAnonymously() {
    const btn = document.getElementById('anonSignBtn');
    const origText = btn ? btn.textContent : '';
    if (btn) { btn.textContent = 'Signing in...'; btn.disabled = true; }

    // Generate a reasonably unique guest handle
    const username = 'guest' + Math.random().toString(36).slice(2, 9);
    const password = Math.random().toString(36).slice(2, 12);
    const email = `${username}@matrix.com`;

    try {
        showAlert('Signing in anonymously...', 'info');

        // Try to create a DB user (reuses existing signUp flow)
        const result = await AuthService.signUp(username, password, email);

        if (result.success && result.user) {
            // Persist session and redirect
            localStorage.setItem('currentUser', JSON.stringify({
                id: result.user.id,
                username: result.user.username,
                email: result.user.email,
                anonymous: true
            }));
            showAlert('Signed in as guest', 'success');
            setTimeout(() => window.location.href = '/messages-page/main.html', 700);
            return;
        }

        // If DB signup failed, fallback to local-only guest session
        const anonSession = { id: `local-${Date.now()}`, username, anonymous: true };
        localStorage.setItem('currentUser', JSON.stringify(anonSession));
        showAlert('Signed in locally as guest (offline)', 'success');
        setTimeout(() => window.location.href = '/messages-page/main.html', 700);

    } catch (err) {
        console.error('Anonymous sign-in failed:', err);
        const anonSession = { id: `local-${Date.now()}`, username, anonymous: true };
        localStorage.setItem('currentUser', JSON.stringify(anonSession));
        showAlert('Signed in locally as guest (offline)', 'success');
        setTimeout(() => window.location.href = '/messages-page/main.html', 700);
    } finally {
        if (btn) { btn.textContent = origText; btn.disabled = false; }
    }
}

// Wire anonymous button when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    const anonBtn = document.getElementById('anonSignBtn');
    if (anonBtn) anonBtn.addEventListener('click', signInAnonymously);
});

// Update closeModal function
function closeModal() {
    const modal = document.getElementById('account-modal');
    modal.classList.remove('show');
}


// Check username availability (simulated)
function checkUsernameAvailability(username) {
    const statusElement = document.getElementById('username-status');

    // Simulate API call with timeout
    setTimeout(() => {
        // In real app, check against database
        const takenUsernames = ['neo', 'morpheus', 'trinity', 'smith'];

        if (username.length < 3) {
            statusElement.textContent = 'Username must be at least 3 characters';
            statusElement.className = 'username-availability taken';
        } else if (takenUsernames.includes(username.toLowerCase())) {
            statusElement.textContent = 'Username already taken';
            statusElement.className = 'username-availability taken';
        } else {
            statusElement.textContent = '✓ Username available';
            statusElement.className = 'username-availability available';
        }
    }, 500);
}

// Check password strength
function checkPasswordStrength(password) {
    const strengthElement = document.getElementById('password-strength');
    const strengthBar = strengthElement.querySelector('.strength-bar');
    const strengthText = strengthElement.querySelector('.strength-text');

    let strength = 0;
    let feedback = '';

    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    // Update UI based on strength
    strengthElement.className = 'password-strength';

    if (password.length === 0) {
        strengthText.textContent = 'Password Strength';
        strengthBar.style.width = '0%';
    } else if (strength === 1) {
        strengthElement.classList.add('strength-weak');
        strengthText.textContent = 'Weak';
        strengthBar.style.width = '33%';
    } else if (strength <= 3) {
        strengthElement.classList.add('strength-medium');
        strengthText.textContent = 'Medium';
        strengthBar.style.width = '66%';
    } else {
        strengthElement.classList.add('strength-strong');
        strengthText.textContent = 'Strong';
        strengthBar.style.width = '100%';
    }
}

// Check password match
function checkPasswordMatch() {
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const matchElement = document.getElementById('password-match');

    if (confirmPassword.length === 0) {
        matchElement.textContent = '';
    } else if (password === confirmPassword) {
        matchElement.textContent = '✓ Passwords match';
        matchElement.style.color = '#0f0';
    } else {
        matchElement.textContent = '✗ Passwords do not match';
        matchElement.style.color = '#f00';
    }
}

// Handle create account form submission
document.getElementById('create-account-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const email = document.getElementById('email').value || username; // Just use username
    const securityQuestion = document.getElementById('security-question').value;
    const securityAnswer = document.getElementById('security-answer').value;
    const terms = document.getElementById('terms').checked;

    // Validation
    if (!username || username.length < 3) {
        showAlert('Username must be at least 3 characters', 'error');
        return;
    }

    if (!password) {
        showAlert('Please enter a password', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
    }

    if (!terms) {
        showAlert('You must agree to the Terms of Service', 'error');
        return;
    }

    // Check if username is available (double-check)
    const checkResult = await AuthService.checkUsernameAvailability(username);
    if (!checkResult.available) {
        showAlert('Username is already taken', 'error');
        return;
    }

    // Show loading alert
    showAlert('Creating account...', 'info');

    // Call signUp with correct parameter order
    const result = await AuthService.signUp(
        username,           // 1st: username
        password,           // 2nd: password  
        email,              // 3rd: email
        securityQuestion,   // 4th: securityQuestion (optional)
        securityAnswer      // 5th: securityAnswer (optional)
    );

    if (result.success) {
        showAlert('Account created successfully! You can now login.', 'success');
        closeModal();

        // Auto-fill the login form
        document.getElementById('username').value = username;
        document.getElementById('password').value = password;
    } else {
        showAlert(`Account creation failed: ${result.error}`, 'error');
    }
});

// Event listeners for real-time validation
async function checkUsernameAvailability(username) {
    const statusElement = document.getElementById('username-status');

    // Clear previous status
    statusElement.textContent = 'Checking...';
    statusElement.className = 'username-availability';

    if (username.length < 3) {
        statusElement.textContent = 'Username must be at least 3 characters';
        statusElement.className = 'username-availability taken';
        return false;
    }

    // Check against Supabase
    const result = await AuthService.checkUsernameAvailability(username);

    if (result.available) {
        statusElement.textContent = '✓ Username available';
        statusElement.className = 'username-availability available';
        return true;
    } else {
        statusElement.textContent = '✗ Username already taken';
        statusElement.className = 'username-availability taken';
        return false;
    }
}

// Event listeners for real-time validation with debounce
let usernameTimeout;
document.getElementById('new-username').addEventListener('input', function () {
    const username = this.value;

    // Clear previous timeout
    if (usernameTimeout) clearTimeout(usernameTimeout);

    if (username.length >= 3) {
        // Debounce the check to avoid too many API calls
        usernameTimeout = setTimeout(() => {
            checkUsernameAvailability(username);
        }, 500); // Wait 500ms after user stops typing
    } else {
        document.getElementById('username-status').textContent = '';
        document.getElementById('username-status').className = 'username-availability';
    }
});

document.getElementById('new-password').addEventListener('input', function () {
    checkPasswordStrength(this.value);
    checkPasswordMatch();
});

document.getElementById('confirm-password').addEventListener('input', checkPasswordMatch);

// Helper functions
function showAlert(message, type) {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.textContent = message;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        background: ${type === 'success' ? 'rgba(10, 10, 10, 0.95)' : 'rgba(10, 10, 10, 0.95)'};
        border: 1px solid ${type === 'success' ? '#00ff9f' : '#ff00ff'};
        color: ${type === 'success' ? '#00ff9f' : '#ff00ff'};
        z-index: 1001;
        border-radius: 4px;
        font-size: 13px;
        font-family: 'Courier New', monospace;
        letter-spacing: 0.5px;
        box-shadow: 0 0 15px ${type === 'success' ? 'rgba(0, 255, 159, 0.3)' : 'rgba(255, 0, 255, 0.3)'};
        animation: slideIn 0.3s ease-out;
        max-width: 350px;
        line-height: 1.4;
    `;

    document.body.appendChild(alert);

    // Remove alert after 3 seconds
    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(alert);
        }, 300);
    }, 3000);
}

// Add CSS for alert animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

function forgotPassword() {
    // Open a small modal asking for email or username and call Supabase reset
    openForgotPasswordModal();
}

function openForgotPasswordModal() {
    if (document.getElementById('forgot-password-modal')) {
        document.getElementById('forgot-password-modal').classList.add('show');
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'forgot-password-modal';
    modal.className = 'modal show';

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.maxWidth = '420px';

    content.innerHTML = `
        <span class="close-modal" id="forgot-close">&times;</span>
        <h2>Reset Password</h2>
        <p style="margin-bottom:12px;color:rgba(255,255,255,0.8);">Enter your email or username. We'll send a password reset link if an account exists.</p>
        <div style="display:flex;flex-direction:column;gap:10px;">
            <input id="forgot-identifier" placeholder="Email or username" style="padding:10px;border-radius:6px;border:1px solid #00ff9f;background:rgba(0,0,0,0.7);color:#00ff9f;" />
            <div style="display:flex;gap:8px;align-items:center;justify-content:flex-end;">
                <button id="forgot-cancel" class="cancel-btn">Cancel</button>
                <button id="forgot-submit" class="create-btn">Send Reset Link</button>
            </div>
        </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Handlers
    document.getElementById('forgot-close').addEventListener('click', closeForgotModal);
    document.getElementById('forgot-cancel').addEventListener('click', (e) => { e.preventDefault(); closeForgotModal(); });
    document.getElementById('forgot-submit').addEventListener('click', async (e) => {
        e.preventDefault();
        const id = document.getElementById('forgot-identifier').value.trim();
        if (!id) {
            showAlert('Please enter your email or username', 'error');
            return;
        }

        // Determine email: if value contains @ treat as email, otherwise assume username and append domain
        let email = id;
        if (!id.includes('@')) email = `${id}@matrix.com`;

        try {
            // Optionally provide a redirect URL to the password reset page (adjust as needed)
            const redirectTo = window.location.origin + '/login-page/login-page.html';
            const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

            if (error) {
                console.error('Reset error:', error);
                // Don't reveal whether account exists — show generic message
                showAlert('If an account exists for that address, a reset link has been sent.', 'success');
            } else {
                showAlert('If an account exists for that address, a reset link has been sent.', 'success');
            }
        } catch (err) {
            console.error('Reset exception:', err);
            showAlert('Unable to send reset link. Please try again later.', 'error');
        } finally {
            closeForgotModal();
        }
    });

    // submit on Enter
    document.getElementById('forgot-identifier').addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') {
            ev.preventDefault();
            document.getElementById('forgot-submit').click();
        }
    });
}

function closeForgotModal() {
    const modal = document.getElementById('forgot-password-modal');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => {
        if (modal.parentNode) modal.parentNode.removeChild(modal);
    }, 220);
}

function showHelp() {
    showAlert('Contact support: support@matrix.com', 'info');
}

function showTerms() {
    showAlert('Terms of Service displayed here', 'info');
}

function showPrivacy() {
    showAlert('Privacy Policy displayed here', 'info');
}

// Close modal when clicking outside
window.addEventListener('click', function (e) {
    const modal = document.getElementById('account-modal');
    if (e.target === modal) {
        closeModal();
    }
    const forgotModal = document.getElementById('forgot-password-modal');
    if (e.target === forgotModal) {
        closeForgotModal();
    }
});

// Resize canvas on window resize
window.addEventListener('resize', () => {
    // Resize main matrix canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Resize modal matrix canvas if it exists
    if (modalCanvas) {
        modalCanvas.width = window.innerWidth;
        modalCanvas.height = window.innerHeight;
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function (e) {
    // Ctrl + N to create new account
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        createAccount();
    }

    // Escape to close modal
    if (e.key === 'Escape') {
        closeModal();
        closeForgotModal();
    }
});

// Add to login-page.js - Help & Support Functions

// Open help modal
function showHelp() {
    const modal = document.getElementById('help-modal');
    modal.classList.add('show');

    // Initialize modal matrix if not already done
    if (!modalCanvas) {
        initializeModalMatrix();
    }

    // Update system time
    updateSystemTime();

    // Start time updates
    helpTimeInterval = setInterval(updateSystemTime, 1000);

    // Reset FAQ states
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
}

// Close help modal
function closeHelpModal() {
    const modal = document.getElementById('help-modal');
    modal.classList.remove('show');

    // Clear time interval
    if (helpTimeInterval) {
        clearInterval(helpTimeInterval);
    }
}

// Toggle FAQ items
function toggleFAQ(element) {
    const faqItem = element.parentElement;
    faqItem.classList.toggle('active');

    // Close other FAQ items (optional - remove if you want multiple open)
    document.querySelectorAll('.faq-item').forEach(item => {
        if (item !== faqItem) {
            item.classList.remove('active');
        }
    });
}

// Update system time display
function updateSystemTime() {
    const now = new Date();
    const timeString = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const systemTimeElement = document.getElementById('system-time');
    if (systemTimeElement) {
        systemTimeElement.textContent = timeString;
    }
}

// Scroll to specific section in help modal
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Submit support request
async function submitSupportRequest(e) {
    e.preventDefault();

    const name = document.getElementById('support-name').value;
    const email = document.getElementById('support-email').value;
    const subject = document.getElementById('support-subject').value;
    const message = document.getElementById('support-message').value;
    const priority = document.getElementById('support-priority').value;

    // Validation
    if (!name || !email || !subject || !message) {
        showAlert('Please fill all required fields', 'error');
        return;
    }

    // Show sending animation
    const submitBtn = document.querySelector('#support-form .create-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Encrypting & Sending...';
    submitBtn.disabled = true;

    // Simulate API call (in real app, this would send to your backend)
    setTimeout(() => {
        // Success simulation
        showAlert('✅ Support request sent securely. We\'ll respond within 2 hours.', 'success');

        // Reset form
        document.getElementById('support-form').reset();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        // Log to console (for debugging)
        console.log('Support Request Submitted:', {
            name,
            email,
            subject,
            message,
            priority,
            timestamp: new Date().toISOString()
        });

    }, 1500);
}

// Emergency protocol
function initiateEmergencyProtocol() {
    showAlert('⚠️ EMERGENCY PROTOCOL INITIATED', 'error');

    // Confirmation
    const confirmEmergency = confirm('WARNING: This will lock your account and require manual verification to restore access. Continue?');

    if (confirmEmergency) {
        // Show emergency sequence
        const emergencySequence = [
            'Initiating lockdown...',
            'Encrypting all sessions...',
            'Terminating active connections...',
            'Sending distress signal...',
            'Emergency protocol complete.'
        ];

        let sequenceIndex = 0;
        const emergencyInterval = setInterval(() => {
            if (sequenceIndex < emergencySequence.length) {
                showAlert(emergencySequence[sequenceIndex], 'error');
                sequenceIndex++;
            } else {
                clearInterval(emergencyInterval);

                // Clear user session
                localStorage.removeItem('currentUser');

                // Show final message
                setTimeout(() => {
                    showAlert('System secured. Contact admin@matrix.com to restore access.', 'error');
                    closeHelpModal();
                }, 1000);
            }
        }, 1000);
    }
}

// Reset tutorial (demo function)
function resetTutorial() {
    showAlert('Tutorial reset. Please refresh the page to see welcome tutorial.', 'info');
    localStorage.removeItem('tutorialCompleted');
}

// Add keyboard shortcut for help
document.addEventListener('keydown', function (e) {
    // Ctrl + H for help
    if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        showHelp();
    }
});

// Initialize help system on page load
document.addEventListener('DOMContentLoaded', function () {
    // Add click outside to close for help modal
    window.addEventListener('click', function (e) {
        const helpModal = document.getElementById('help-modal');
        if (e.target === helpModal) {
            closeHelpModal();
        }
    });

    // Add enter key support for FAQ
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleFAQ(this);
            }
        });
        question.setAttribute('tabindex', '0');
        question.setAttribute('role', 'button');
    });

    // Add ARIA labels for accessibility
    document.querySelectorAll('.quick-link-card').forEach(card => {
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
});


// Update the existing showHelp function call in the HTML
// Change the existing help link to use the new modal
// In your HTML, the existing help link should now call showHelp() instead of showAlert