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
        window.location.href = '/messages-page/main.html';
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
        showAlert(`Link secured. Speak quietly… they’re listening, ${username}.`, 'success');

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
        padding: 10px 15px;
        background: ${type === 'success' ? 'rgba(0, 255, 159, 0.1)' : type === 'info' ? 'rgba(0, 204, 255, 0.1)' : 'rgba(255, 0, 255, 0.1)'};
        border: 2px solid ${type === 'success' ? '#00ff9f' : type === 'info' ? '#00ccff' : '#ff00ff'};
        color: ${type === 'success' ? '#00ff9f' : type === 'info' ? '#00ccff' : '#ff00ff'};
        z-index: 1001;
        border-radius: 5px;
        animation: slideIn 0.3s ease-out;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        max-width: 300px;
        box-shadow: 0 0 20px ${type === 'success' ? 'rgba(0, 255, 159, 0.3)' : type === 'info' ? 'rgba(0, 204, 255, 0.3)' : 'rgba(255, 0, 255, 0.3)'};
    `;

    document.body.appendChild(alert);

    // Remove alert after 3 seconds
    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(alert);
        }, 300);
    }, 5000);
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
    showAlert('Password reset feature coming soon!', 'info');
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
    }
}); 