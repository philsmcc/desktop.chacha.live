require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Multer for file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
        }
    }
});

// S3 Client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// SES Client for email
const sesClient = new SESClient({
    region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const BUCKET = process.env.S3_BUCKET;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@hovercam.com';
const APP_URL = process.env.APP_URL || 'https://desktop.chacha.live';

// In-memory stores
const users = new Map();
const verificationTokens = new Map();
const pendingUsers = new Map();
const passwordResetTokens = new Map();

// Default wallpapers
const defaultWallpapers = [
    { id: 'default1', name: 'Gradient Dark', url: '/wallpapers/gradient-dark.jpg' },
    { id: 'default2', name: 'Gradient Light', url: '/wallpapers/gradient-light.jpg' },
    { id: 'default3', name: 'Abstract Orange', url: '/wallpapers/abstract-orange.jpg' }
];

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// Helpers
const getUserPrefix = (username) => `users/${username}`;
const getDefaultPreferences = () => ({
    theme: 'light',
    wallpaper: 'gradient-light1',
    wallpaperType: 'gradient',
    wallpaperColor: '#f5f7fa',
    iconPositions: {},
    lastLogin: new Date().toISOString()
});
const generateVerificationToken = () => crypto.randomBytes(32).toString('hex');

// Email template
const generateVerificationEmail = (username, verificationUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f7fa;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 520px; border-collapse: collapse;">
                    <tr>
                        <td align="center" style="padding-bottom: 32px;">
                            <table role="presentation" style="border-collapse: collapse;">
                                <tr>
                                    <td style="width: 48px; height: 48px; background: linear-gradient(135deg, #f57c00, #e65100); border-radius: 12px; text-align: center; vertical-align: middle;">
                                        <span style="color: white; font-size: 24px; font-weight: bold;">H</span>
                                    </td>
                                    <td style="padding-left: 12px;">
                                        <span style="font-size: 24px; font-weight: 700; color: #1a1a2e;">HoverCam</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
                            <div style="height: 4px; background: linear-gradient(90deg, #f57c00, #ff9800); border-radius: 16px 16px 0 0;"></div>
                            <div style="padding: 40px;">
                                <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #1a1a2e; text-align: center;">
                                    Welcome aboard, ${username}! 🎉
                                </h1>
                                <p style="margin: 0 0 32px 0; font-size: 16px; color: #666; text-align: center; line-height: 1.6;">
                                    You're just one click away from accessing your HoverCam Desktop. Please verify your email address to activate your account.
                                </p>
                                <div style="text-align: center; margin-bottom: 32px;">
                                    <a href="${verificationUrl}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #f57c00, #e65100); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px;">
                                        Verify Email Address
                                    </a>
                                </div>
                                <p style="margin: 0 0 16px 0; font-size: 14px; color: #888; text-align: center;">
                                    Or copy and paste this link in your browser:
                                </p>
                                <div style="background: #f8f9fa; border-radius: 8px; padding: 12px 16px; word-break: break-all;">
                                    <a href="${verificationUrl}" style="font-size: 13px; color: #f57c00; text-decoration: none;">${verificationUrl}</a>
                                </div>
                                <p style="margin: 24px 0 0 0; font-size: 13px; color: #999; text-align: center;">
                                    ⏰ This link expires in 24 hours
                                </p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px 20px; text-align: center;">
                            <p style="margin: 0 0 8px 0; font-size: 13px; color: #888;">
                                Didn't create an account? You can safely ignore this email.
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #aaa;">
                                © ${new Date().getFullYear()} HoverCam Desktop • Made with ❤️ for educators
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

const sendVerificationEmail = async (email, username, token) => {
    const verificationUrl = `${APP_URL}/api/auth/verify?token=${token}`;
    const params = {
        Source: FROM_EMAIL,
        Destination: { ToAddresses: [email] },
        Message: {
            Subject: { Data: 'Verify your HoverCam Desktop account', Charset: 'UTF-8' },
            Body: {
                Html: { Data: generateVerificationEmail(username, verificationUrl), Charset: 'UTF-8' },
                Text: { Data: `Welcome to HoverCam Desktop, ${username}!\n\nPlease verify your email: ${verificationUrl}\n\nThis link expires in 24 hours.`, Charset: 'UTF-8' }
            }
        }
    };
    await sesClient.send(new SendEmailCommand(params));
};

// ==================== AUTH ROUTES ====================

// Register with email verification
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }
        if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' });
        if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return res.status(400).json({ error: 'Please enter a valid email address' });

        if (users.has(username) || pendingUsers.has(username)) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        const emailExists = Array.from(users.values()).some(u => u.email === email) ||
                           Array.from(pendingUsers.values()).some(u => u.email === email);
        if (emailExists) return res.status(409).json({ error: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = generateVerificationToken();
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        pendingUsers.set(username, { username, email, password: hashedPassword, verificationToken, createdAt: new Date().toISOString() });
        verificationTokens.set(verificationToken, { username, email, expires });

        try {
            await sendVerificationEmail(email, username, verificationToken);
        } catch (emailError) {
            console.error('Email error:', emailError);
            pendingUsers.delete(username);
            verificationTokens.delete(verificationToken);
            return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
        }

        res.status(201).json({ message: 'Please check your email to verify your account.', requiresVerification: true });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Verify email
app.get('/api/auth/verify', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.redirect(`${APP_URL}?error=invalid_token`);

        const tokenData = verificationTokens.get(token);
        if (!tokenData) return res.redirect(`${APP_URL}?error=invalid_token`);
        if (new Date() > tokenData.expires) {
            verificationTokens.delete(token);
            pendingUsers.delete(tokenData.username);
            return res.redirect(`${APP_URL}?error=token_expired`);
        }

        const pendingUser = pendingUsers.get(tokenData.username);
        if (!pendingUser) return res.redirect(`${APP_URL}?error=user_not_found`);

        users.set(pendingUser.username, {
            username: pendingUser.username,
            email: pendingUser.email,
            password: pendingUser.password,
            emailVerified: true,
            createdAt: pendingUser.createdAt,
            verifiedAt: new Date().toISOString()
        });

        pendingUsers.delete(tokenData.username);
        verificationTokens.delete(token);

        // Create S3 structure
        try {
            const preferences = getDefaultPreferences();
            await s3Client.send(new PutObjectCommand({
                Bucket: BUCKET, Key: `${getUserPrefix(pendingUser.username)}/preferences.json`,
                Body: JSON.stringify(preferences), ContentType: 'application/json'
            }));
            for (const folder of ['wallpapers', 'files/Documents', 'files/Pictures', 'files/Videos']) {
                await s3Client.send(new PutObjectCommand({
                    Bucket: BUCKET, Key: `${getUserPrefix(pendingUser.username)}/${folder}/.keep`,
                    Body: '', ContentType: 'text/plain'
                }));
            }
        } catch (s3Error) { console.error('S3 setup error:', s3Error); }

        res.redirect(`${APP_URL}?verified=true`);
    } catch (error) {
        console.error('Verification error:', error);
        res.redirect(`${APP_URL}?error=verification_failed`);
    }
});

// Resend verification
app.post('/api/auth/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const pendingUser = Array.from(pendingUsers.values()).find(u => u.email === email);
        if (!pendingUser) return res.status(404).json({ error: 'No pending registration found' });

        if (pendingUser.verificationToken) verificationTokens.delete(pendingUser.verificationToken);

        const newToken = generateVerificationToken();
        pendingUser.verificationToken = newToken;
        pendingUsers.set(pendingUser.username, pendingUser);
        verificationTokens.set(newToken, { username: pendingUser.username, email, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) });

        await sendVerificationEmail(email, pendingUser.username, newToken);
        res.json({ message: 'Verification email sent!' });
    } catch (error) {
        console.error('Resend error:', error);
        res.status(500).json({ error: 'Failed to resend verification email' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

        const user = users.get(username);
        if (!user) {
            if (pendingUsers.has(username)) {
                const pending = pendingUsers.get(username);
                return res.status(403).json({ error: 'Please verify your email first', requiresVerification: true, email: pending.email });
            }
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid username or password' });

        const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ message: 'Login successful', token, user: { username: user.username, email: user.email } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Forgot Password - Request reset
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        // Find user by email
        const user = Array.from(users.values()).find(u => u.email === email);
        if (!user) {
            // Don't reveal if email exists - always show success
            return res.json({ message: 'If an account exists with this email, you will receive a password reset link.' });
        }

        // Generate reset token
        const resetToken = generateVerificationToken();
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Remove any existing reset token for this user
        for (const [token, data] of passwordResetTokens.entries()) {
            if (data.username === user.username) {
                passwordResetTokens.delete(token);
            }
        }

        passwordResetTokens.set(resetToken, { 
            username: user.username, 
            email: user.email, 
            expires 
        });

        try {
            await sendPasswordResetEmail(email, user.username, resetToken);
        } catch (emailError) {
            console.error('Password reset email error:', emailError);
            passwordResetTokens.delete(resetToken);
            return res.status(500).json({ error: 'Failed to send reset email. Please try again.' });
        }

        res.json({ message: 'If an account exists with this email, you will receive a password reset link.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// Reset Password - Set new password
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
        if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

        const tokenData = passwordResetTokens.get(token);
        if (!tokenData) return res.status(400).json({ error: 'Invalid or expired reset link' });
        if (new Date() > tokenData.expires) {
            passwordResetTokens.delete(token);
            return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
        }

        const user = users.get(tokenData.username);
        if (!user) return res.status(400).json({ error: 'User not found' });

        // Update password
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        users.set(tokenData.username, user);

        // Remove used token
        passwordResetTokens.delete(token);

        res.json({ message: 'Password reset successful. You can now sign in with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// Verify reset token (check if valid before showing form)
app.get('/api/auth/verify-reset-token', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ valid: false, error: 'Token required' });

        const tokenData = passwordResetTokens.get(token);
        if (!tokenData) return res.json({ valid: false, error: 'Invalid reset link' });
        if (new Date() > tokenData.expires) {
            passwordResetTokens.delete(token);
            return res.json({ valid: false, error: 'Reset link has expired' });
        }

        res.json({ valid: true, username: tokenData.username });
    } catch (error) {
        res.status(500).json({ valid: false, error: 'Verification failed' });
    }
});

// ==================== PREFERENCES ROUTES ====================
app.get('/api/preferences', authenticateToken, async (req, res) => {
    try {
        const key = `${getUserPrefix(req.user.username)}/preferences.json`;
        try {
            const response = await s3Client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
            const body = await response.Body.transformToString();
            res.json(JSON.parse(body));
        } catch (error) {
            if (error.name === 'NoSuchKey') res.json(getDefaultPreferences());
            else throw error;
        }
    } catch (error) {
        console.error('Preferences error:', error);
        res.status(500).json({ error: 'Failed to get preferences' });
    }
});

app.put('/api/preferences', authenticateToken, async (req, res) => {
    try {
        const key = `${getUserPrefix(req.user.username)}/preferences.json`;
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET, Key: key, Body: JSON.stringify(req.body), ContentType: 'application/json'
        }));
        res.json({ message: 'Preferences saved' });
    } catch (error) {
        console.error('Save preferences error:', error);
        res.status(500).json({ error: 'Failed to save preferences' });
    }
});

// ==================== FILES ROUTES ====================
app.get('/api/files', authenticateToken, async (req, res) => {
    try {
        const path = req.query.path || '';
        const prefix = `${getUserPrefix(req.user.username)}/files/${path}`.replace(/\/+/g, '/').replace(/\/$/, '') + '/';
        
        const response = await s3Client.send(new ListObjectsV2Command({
            Bucket: BUCKET, Prefix: prefix, Delimiter: '/'
        }));

        const folders = (response.CommonPrefixes || []).map(p => {
            const name = p.Prefix.replace(prefix, '').replace('/', '');
            return { name, type: 'folder', path: p.Prefix };
        }).filter(f => f.name && f.name !== '.keep');

        const files = (response.Contents || []).filter(f => !f.Key.endsWith('.keep') && f.Key !== prefix).map(f => {
            const name = f.Key.split('/').pop();
            return { name, type: 'file', size: f.Size, modified: f.LastModified, key: f.Key };
        });

        res.json({ folders, files, currentPath: path });
    } catch (error) {
        console.error('List files error:', error);
        res.status(500).json({ error: 'Failed to list files' });
    }
});

app.post('/api/files/folder', authenticateToken, async (req, res) => {
    try {
        const { path, name } = req.body;
        const key = `${getUserPrefix(req.user.username)}/files/${path || ''}${name}/.keep`.replace(/\/+/g, '/');
        await s3Client.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: '', ContentType: 'text/plain' }));
        res.json({ message: 'Folder created' });
    } catch (error) {
        console.error('Create folder error:', error);
        res.status(500).json({ error: 'Failed to create folder' });
    }
});

app.post('/api/files/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const path = req.body.path || '';
        const key = `${getUserPrefix(req.user.username)}/files/${path}${req.file.originalname}`.replace(/\/+/g, '/');
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET, Key: key, Body: req.file.buffer, ContentType: req.file.mimetype
        }));
        const url = await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 3600 });
        res.json({ message: 'File uploaded', url, key });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

app.get('/api/files/url', authenticateToken, async (req, res) => {
    try {
        const { key } = req.query;
        const url = await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 3600 });
        res.json({ url });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get URL' });
    }
});

app.delete('/api/files', authenticateToken, async (req, res) => {
    try {
        const { key } = req.query;
        await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
        res.json({ message: 'File deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// ==================== WALLPAPERS ROUTES ====================
app.get('/api/wallpapers/system', (req, res) => { res.json(defaultWallpapers); });

app.get('/api/wallpapers/user', authenticateToken, async (req, res) => {
    try {
        const prefix = `${getUserPrefix(req.user.username)}/wallpapers/`;
        const response = await s3Client.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix }));
        const wallpapers = await Promise.all((response.Contents || []).filter(f => !f.Key.endsWith('.keep')).map(async f => {
            const url = await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: BUCKET, Key: f.Key }), { expiresIn: 3600 });
            return { id: f.Key, name: f.Key.split('/').pop(), url, key: f.Key };
        }));
        res.json(wallpapers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get wallpapers' });
    }
});

app.post('/api/wallpapers/upload', authenticateToken, upload.single('wallpaper'), async (req, res) => {
    try {
        const key = `${getUserPrefix(req.user.username)}/wallpapers/${Date.now()}-${req.file.originalname}`;
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET, Key: key, Body: req.file.buffer, ContentType: req.file.mimetype
        }));
        const url = await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 3600 });
        res.json({ id: key, name: req.file.originalname, url, key });
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload wallpaper' });
    }
});

app.post('/api/wallpapers/url', authenticateToken, async (req, res) => {
    try {
        const { url: imageUrl } = req.body;
        const response = await fetch(imageUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        const key = `${getUserPrefix(req.user.username)}/wallpapers/${Date.now()}-wallpaper.jpg`;
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET, Key: key, Body: buffer, ContentType: 'image/jpeg'
        }));
        const url = await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 3600 });
        res.json({ id: key, name: 'wallpaper.jpg', url, key });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save wallpaper from URL' });
    }
});

app.delete('/api/wallpapers/delete', authenticateToken, async (req, res) => {
    try {
        const { key } = req.query;
        await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
        res.json({ message: 'Wallpaper deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete wallpaper' });
    }
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`HoverCam API running on port ${PORT}`);
    console.log(`S3 Bucket: ${BUCKET}`);
});
