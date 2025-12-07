# 🔐 CipherChat - Encrypted Messaging Web App

A cyberpunk-themed end-to-end encrypted messaging application with multiple classical cipher implementations. Built with vanilla JavaScript and Supabase.

![CipherChat Banner](https://img.shields.io/badge/Encryption-E2EE-00ff9f?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-00ccff?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-ff00ff?style=for-the-badge)

## ✨ Features

### 🔒 Multiple Encryption Ciphers
- **Shift Cipher** - Classic Caesar cipher with customizable shift values
- **Vigenère Cipher** - Polyalphabetic substitution using keyword-based encryption
- **Playfair Cipher** - Digraph substitution cipher using a 5×5 matrix
- **Rail Fence Cipher** - Transposition cipher with zigzag pattern
- **Columnar Cipher** - Transposition cipher using columnar arrangement

### 💬 Messaging Features
- Real-time encrypted messaging
- User-to-user private conversations
- Message decryption with right-click context menu
- Joint password system for bulk message decryption
- Conversation-specific message deletion
- Search and filter users

### 🎨 Design
- Cyberpunk/hacker aesthetic with neon colors
- Animated Matrix rain background effect
- Cyan-green (#00ff9f) and Magenta (#ff00ff) accent colors
- Responsive design for desktop and mobile
- Smooth animations and transitions

### 🔐 Security
- End-to-end encryption using classical ciphers
- User authentication with Supabase
- Password-protected accounts
- Joint password verification system
- Secure session management

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js (for local development)
- Supabase account (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cipherchat.git
   cd cipherchat
   ```

2. **Set up Supabase**

   Create a new project at [supabase.com](https://supabase.com)

   Run this SQL in your Supabase SQL Editor:

   ```sql
   -- Users table
   CREATE TABLE users (
     id SERIAL PRIMARY KEY,
     username TEXT UNIQUE NOT NULL,
     password TEXT NOT NULL,
     email TEXT,
     security_question TEXT,
     security_answer TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Messages table
   CREATE TABLE messages (
     id SERIAL PRIMARY KEY,
     sender_username TEXT NOT NULL,
     recipient_username TEXT NOT NULL,
     cipher_type TEXT NOT NULL,
     encryption_key TEXT NOT NULL,
     encrypted_content TEXT NOT NULL,
     decrypted_content TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Joint passwords table
   CREATE TABLE joint_passwords (
     id SERIAL PRIMARY KEY,
     user1_username TEXT NOT NULL,
     user2_username TEXT NOT NULL,
     password_hash TEXT,
     status TEXT NOT NULL DEFAULT 'pending',
     initiated_by TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(user1_username, user2_username)
   );

   -- Enable Row Level Security
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
   ALTER TABLE joint_passwords ENABLE ROW LEVEL SECURITY;

   -- Create policies (allow all for demo purposes)
   CREATE POLICY "Allow all operations" ON users FOR ALL USING (true) WITH CHECK (true);
   CREATE POLICY "Allow all operations" ON messages FOR ALL USING (true) WITH CHECK (true);
   CREATE POLICY "Allow all operations" ON joint_passwords FOR ALL USING (true) WITH CHECK (true);
   ```

3. **Configure Supabase credentials**

   Update the Supabase URL and API key in these files:
   - `login-page/login-page.js`
   - `messages-page/messenger-app.js`

   ```javascript
   const SUPABASE_URL = 'your-project-url';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   ```

4. **Run locally**

   You can use any static file server:

   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js
   npx http-server

   # Using VS Code Live Server extension
   # Right-click on login-page/index.html → Open with Live Server
   ```

5. **Open in browser**
   ```
   http://localhost:8000/login-page/index.html
   ```

## 📁 Project Structure

```
cipherchat/
├── login-page/
│   ├── index.html          # Login/signup page
│   ├── login-page.css      # Login page styles
│   └── login-page.js       # Authentication logic
├── messages-page/
│   ├── main.html           # Main messenger interface
│   ├── main.css            # Messenger styles
│   └── messenger-app.js    # Messaging & encryption logic
├── supabase-config.js      # Supabase configuration
├── vercel.json             # Vercel deployment config
└── README.md               # This file
```

## 🎯 Usage

### Creating an Account

1. Navigate to the login page
2. Click "Create New Account"
3. Fill in your details:
   - Username (min 3 characters)
   - Password (min 4 characters)
   - Email (optional)
   - Security question & answer (optional)
4. Click "Create Account"

### Sending Encrypted Messages

1. Log in with your credentials
2. Select a user from the left sidebar
3. Choose your encryption cipher from the dropdown
4. Enter an encryption key
5. Type your message
6. Click "Encrypt & Send"

### Decrypting Messages

**Single Message:**
- Right-click on any encrypted message
- Enter the encryption key
- Click the checkmark to decrypt

**All Messages (Joint Password):**
1. Click "🔓 Decrypt All" button
2. If no joint password exists:
   - Enter a password
   - Wait for the other user to accept
3. Other user will see a dialog:
   - Enter the same password
   - Click "Accept"
4. Once established, either user can decrypt all messages with the joint password

### Cipher Key Guidelines

| Cipher | Key Type | Example |
|--------|----------|---------|
| Shift | Number | `3` or `13` |
| Vigenère | Text | `SECRET` or `KEY` |
| Playfair | Text | `MONARCHY` |
| Rail Fence | Number (≥2) | `3` or `4` |
| Columnar | Text | `ZEBRA` |

## 🔧 Configuration

### Customizing Colors

Edit `main.css` and `login-page.css` to change the color scheme:

```css
:root {
    --primary-cyan: #00ff9f;
    --secondary-cyan: #00ccff;
    --magenta: #ff00ff;
    --bg-deep: #0a0a0a;
    --bg-dark: #1a001a;
}
```

### Modifying Ciphers

All cipher implementations are in `messenger-app.js`. You can:
- Add new ciphers
- Modify existing algorithms
- Change encryption parameters

## 🌐 Deployment

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

### Deploy to Netlify

1. Drag and drop your project folder to [netlify.com](https://netlify.com)
2. Configure build settings (not needed for static site)
3. Deploy

### Deploy to GitHub Pages

1. Push to GitHub
2. Go to Settings → Pages
3. Select branch and `/root` folder
4. Save

## 🛡️ Security Notes

⚠️ **Important:** This application uses classical ciphers for educational purposes. These ciphers are **NOT cryptographically secure** for real-world sensitive communications.

For production use, consider:
- Implementing modern encryption (AES, RSA)
- Using proper key exchange protocols (Diffie-Hellman)
- Adding message authentication codes (HMAC)
- Implementing forward secrecy
- Using HTTPS/TLS

## 🐛 Known Issues

- Classical ciphers are vulnerable to cryptanalysis
- Joint password uses simple hashing (not bcrypt/argon2)
- No rate limiting on API calls
- Messages stored in plaintext in database (decrypted_content field)

## 🔮 Future Enhancements

- [ ] Modern encryption algorithms (AES-256)
- [ ] File/image sharing
- [ ] Group chats
- [ ] Voice messages
- [ ] Read receipts
- [ ] Typing indicators
- [ ] Message editing/deletion
- [ ] User profiles and avatars
- [ ] Dark/light theme toggle
- [ ] Mobile app (React Native)
- [ ] End-to-end encrypted video calls

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Contact

Project Link: [https://github.com/yourusername/cipherchat](https://github.com/yourusername/cipherchat)

## Acknowledgments

- Matrix rain effect inspiration
- Classical cipher algorithms
- Supabase for backend infrastructure
- Vercel for hosting

---

<div align="center">

**Built with ❤️ and 🔐**

*"What happens here, stays here..."*

</div>
