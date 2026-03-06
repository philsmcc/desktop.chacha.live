require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Pool } = require('pg');
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand, CopyObjectCommand } = require('@aws-sdk/client-s3');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'webapp_db',
    user: process.env.DB_USER || 'webapp',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.query('SELECT NOW()')
    .then(() => console.log('✓ PostgreSQL connected'))
    .catch(err => console.error('✗ PostgreSQL connection error:', err.message));

// Multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        cb(null, allowedTypes.includes(file.mimetype));
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

// SES Client
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
const getUserPrefix = (email) => `users/${email.replace('@', '_at_').replace(/\./g, '_')}`;
const getDefaultPreferences = () => ({
    theme: 'light',
    wallpaper: 'gradient-light1',
    wallpaperType: 'gradient',
    wallpaperColor: '#f5f7fa',
    iconPositions: {},
    lastLogin: new Date().toISOString()
});
const generateToken = () => crypto.randomBytes(32).toString('hex');

// Email Templates
const generateVerificationEmail = (email, verificationUrl) => `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f5f7fa;">
<table style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:40px 20px;">
<table style="width:100%;max-width:520px;border-collapse:collapse;">
<tr><td align="center" style="padding-bottom:32px;">
<table style="border-collapse:collapse;"><tr>
<td style="width:48px;height:48px;background:linear-gradient(135deg,#f57c00,#e65100);border-radius:12px;text-align:center;vertical-align:middle;">
<span style="color:white;font-size:24px;font-weight:bold;">H</span></td>
<td style="padding-left:12px;"><span style="font-size:24px;font-weight:700;color:#1a1a2e;">HoverCam</span></td>
</tr></table></td></tr>
<tr><td style="background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<div style="height:4px;background:linear-gradient(90deg,#f57c00,#ff9800);border-radius:16px 16px 0 0;"></div>
<div style="padding:40px;">
<h1 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#1a1a2e;text-align:center;">Welcome to HoverCam!</h1>
<p style="margin:0 0 32px;font-size:16px;color:#666;text-align:center;line-height:1.6;">Click below to verify your email and activate your account.</p>
<div style="text-align:center;margin-bottom:32px;">
<a href="${verificationUrl}" style="display:inline-block;padding:16px 48px;background:linear-gradient(135deg,#f57c00,#e65100);color:#fff;text-decoration:none;font-size:16px;font-weight:600;border-radius:12px;">Verify Email</a>
</div>
<p style="margin:24px 0 0;font-size:13px;color:#999;text-align:center;">This link expires in 24 hours</p>
</div></td></tr>
<tr><td style="padding:32px 20px;text-align:center;">
<p style="margin:0;font-size:12px;color:#aaa;">© ${new Date().getFullYear()} HoverCam Desktop</p>
</td></tr></table></td></tr></table></body></html>`;

const generatePasswordResetEmail = (email, resetUrl) => `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f5f7fa;">
<table style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:40px 20px;">
<table style="width:100%;max-width:520px;border-collapse:collapse;">
<tr><td align="center" style="padding-bottom:32px;">
<table style="border-collapse:collapse;"><tr>
<td style="width:48px;height:48px;background:linear-gradient(135deg,#f57c00,#e65100);border-radius:12px;text-align:center;vertical-align:middle;">
<span style="color:white;font-size:24px;font-weight:bold;">H</span></td>
<td style="padding-left:12px;"><span style="font-size:24px;font-weight:700;color:#1a1a2e;">HoverCam</span></td>
</tr></table></td></tr>
<tr><td style="background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<div style="height:4px;background:linear-gradient(90deg,#f57c00,#ff9800);border-radius:16px 16px 0 0;"></div>
<div style="padding:40px;">
<h1 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#1a1a2e;text-align:center;">Reset Your Password</h1>
<p style="margin:0 0 32px;font-size:16px;color:#666;text-align:center;line-height:1.6;">Click below to create a new password.</p>
<div style="text-align:center;margin-bottom:32px;">
<a href="${resetUrl}" style="display:inline-block;padding:16px 48px;background:linear-gradient(135deg,#f57c00,#e65100);color:#fff;text-decoration:none;font-size:16px;font-weight:600;border-radius:12px;">Reset Password</a>
</div>
<p style="margin:24px 0 0;font-size:13px;color:#999;text-align:center;">This link expires in 1 hour</p>
</div></td></tr>
<tr><td style="padding:32px 20px;text-align:center;">
<p style="margin:0;font-size:12px;color:#aaa;">© ${new Date().getFullYear()} HoverCam Desktop</p>
</td></tr></table></td></tr></table></body></html>`;

const sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${APP_URL}/api/auth/verify?token=${token}`;
    await sesClient.send(new SendEmailCommand({
        Source: FROM_EMAIL,
        Destination: { ToAddresses: [email] },
        Message: {
            Subject: { Data: 'Verify your HoverCam Desktop account', Charset: 'UTF-8' },
            Body: {
                Html: { Data: generateVerificationEmail(email, verificationUrl), Charset: 'UTF-8' },
                Text: { Data: `Verify your email: ${verificationUrl}`, Charset: 'UTF-8' }
            }
        }
    }));
};

const sendPasswordResetEmail = async (email, token) => {
    const resetUrl = `${APP_URL}/reset-password.html?token=${token}`;
    await sesClient.send(new SendEmailCommand({
        Source: FROM_EMAIL,
        Destination: { ToAddresses: [email] },
        Message: {
            Subject: { Data: 'Reset your HoverCam Desktop password', Charset: 'UTF-8' },
            Body: {
                Html: { Data: generatePasswordResetEmail(email, resetUrl), Charset: 'UTF-8' },
                Text: { Data: `Reset your password: ${resetUrl}`, Charset: 'UTF-8' }
            }
        }
    }));
};

// ==================== AUTH ROUTES ====================

// Register - Email is the username
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const emailLower = email.toLowerCase().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailLower)) return res.status(400).json({ error: 'Please enter a valid email address' });
        if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

        // Check if email exists
        const existingUser = await pool.query(
            'SELECT email FROM users WHERE email = $1 UNION SELECT email FROM pending_users WHERE email = $1',
            [emailLower]
        );
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = generateToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await pool.query(
            'INSERT INTO pending_users (username, email, password_hash, verification_token, token_expires_at) VALUES ($1, $2, $3, $4, $5)',
            [emailLower, emailLower, hashedPassword, verificationToken, expiresAt]
        );

        try {
            await sendVerificationEmail(emailLower, verificationToken);
        } catch (emailError) {
            console.error('Email error:', emailError);
            await pool.query('DELETE FROM pending_users WHERE email = $1', [emailLower]);
            return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
        }

        res.status(201).json({ message: 'Please check your email to verify your account.', requiresVerification: true });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Verify Email
app.get('/api/auth/verify', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.redirect(`${APP_URL}?error=invalid_token`);

        const result = await pool.query(
            'SELECT * FROM pending_users WHERE verification_token = $1',
            [token]
        );

        if (result.rows.length === 0) return res.redirect(`${APP_URL}?error=invalid_token`);
        
        const pendingUser = result.rows[0];
        if (new Date() > new Date(pendingUser.token_expires_at)) {
            await pool.query('DELETE FROM pending_users WHERE id = $1', [pendingUser.id]);
            return res.redirect(`${APP_URL}?error=token_expired`);
        }

        // Move to users table
        await pool.query(
            'INSERT INTO users (username, email, password_hash, email_verified, verified_at) VALUES ($1, $2, $3, true, NOW())',
            [pendingUser.email, pendingUser.email, pendingUser.password_hash]
        );

        await pool.query('DELETE FROM pending_users WHERE id = $1', [pendingUser.id]);

        // Create S3 structure
        try {
            const preferences = getDefaultPreferences();
            await s3Client.send(new PutObjectCommand({
                Bucket: BUCKET, Key: `${getUserPrefix(pendingUser.email)}/preferences.json`,
                Body: JSON.stringify(preferences), ContentType: 'application/json'
            }));
            for (const folder of ['wallpapers', 'files/Desktop', 'files/Documents', 'files/Pictures', 'files/Videos']) {
                await s3Client.send(new PutObjectCommand({
                    Bucket: BUCKET, Key: `${getUserPrefix(pendingUser.email)}/${folder}/.keep`,
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

// Resend Verification
app.post('/api/auth/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const emailLower = email.toLowerCase().trim();
        const result = await pool.query('SELECT * FROM pending_users WHERE email = $1', [emailLower]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'No pending registration found' });

        const pendingUser = result.rows[0];
        const newToken = generateToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await pool.query(
            'UPDATE pending_users SET verification_token = $1, token_expires_at = $2 WHERE id = $3',
            [newToken, expiresAt, pendingUser.id]
        );

        await sendVerificationEmail(emailLower, newToken);
        res.json({ message: 'Verification email sent!' });
    } catch (error) {
        console.error('Resend error:', error);
        res.status(500).json({ error: 'Failed to resend verification email' });
    }
});

// Login - Using email as identifier
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('Login request body:', JSON.stringify(req.body));
        const { email, password } = req.body;
        if (!email || !password) {
            console.log('Missing email or password. Email:', !!email, 'Password:', !!password);
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const emailLower = email.toLowerCase().trim();
        console.log('Login attempt for:', emailLower);

        // Check verified users
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [emailLower]);
        
        if (userResult.rows.length === 0) {
            // Check if pending
            const pendingResult = await pool.query('SELECT email FROM pending_users WHERE email = $1', [emailLower]);
            if (pendingResult.rows.length > 0) {
                return res.status(403).json({ error: 'Please verify your email first', requiresVerification: true, email: emailLower });
            }
            console.log('User not found:', emailLower);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = userResult.rows[0];
        console.log('User found, checking password...');
        
        console.log('Stored hash:', user.password_hash.substring(0, 30) + '...');
        const validPassword = await bcrypt.compare(password, user.password_hash);
        console.log('Password valid:', validPassword);
        
        if (!validPassword) return res.status(401).json({ error: 'Invalid email or password' });

        const token = jwt.sign({ email: emailLower, id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        await pool.query('UPDATE users SET updated_at = NOW() WHERE id = $1', [user.id]);
        
        res.json({ message: 'Login successful', token, user: { email: user.email } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const emailLower = email.toLowerCase().trim();
        const result = await pool.query('SELECT id, email FROM users WHERE email = $1', [emailLower]);
        
        if (result.rows.length === 0) {
            return res.json({ message: 'If an account exists with this email, you will receive a password reset link.' });
        }

        const user = result.rows[0];
        const resetToken = generateToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);
        await pool.query(
            'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.id, resetToken, expiresAt]
        );

        try {
            await sendPasswordResetEmail(emailLower, resetToken);
        } catch (emailError) {
            console.error('Password reset email error:', emailError);
            await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [resetToken]);
            return res.status(500).json({ error: 'Failed to send reset email. Please try again.' });
        }

        res.json({ message: 'If an account exists with this email, you will receive a password reset link.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// Verify Reset Token
app.get('/api/auth/verify-reset-token', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ valid: false, error: 'Token required' });

        const result = await pool.query(
            `SELECT prt.*, u.email FROM password_reset_tokens prt 
             JOIN users u ON prt.user_id = u.id 
             WHERE prt.token = $1`,
            [token]
        );

        if (result.rows.length === 0) return res.json({ valid: false, error: 'Invalid reset link' });
        
        const tokenData = result.rows[0];
        if (new Date() > new Date(tokenData.expires_at)) {
            await pool.query('DELETE FROM password_reset_tokens WHERE id = $1', [tokenData.id]);
            return res.json({ valid: false, error: 'Reset link has expired' });
        }

        res.json({ valid: true, email: tokenData.email });
    } catch (error) {
        res.status(500).json({ valid: false, error: 'Verification failed' });
    }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
        if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

        const result = await pool.query('SELECT * FROM password_reset_tokens WHERE token = $1', [token]);

        if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired reset link' });
        
        const tokenData = result.rows[0];
        if (new Date() > new Date(tokenData.expires_at)) {
            await pool.query('DELETE FROM password_reset_tokens WHERE id = $1', [tokenData.id]);
            return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Resetting password for user_id:', tokenData.user_id);
        console.log('New hash:', hashedPassword.substring(0, 30) + '...');
        
        const updateResult = await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email', [hashedPassword, tokenData.user_id]);
        console.log('Update result:', updateResult.rows);
        
        await pool.query('DELETE FROM password_reset_tokens WHERE id = $1', [tokenData.id]);

        res.json({ message: 'Password reset successful. You can now sign in with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// ==================== PREFERENCES ROUTES ====================
app.get('/api/preferences', authenticateToken, async (req, res) => {
    try {
        const key = `${getUserPrefix(req.user.email)}/preferences.json`;
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
        const key = `${getUserPrefix(req.user.email)}/preferences.json`;
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
        const folder = req.query.folder || '';
        let prefix = `${getUserPrefix(req.user.email)}/files/${folder}`.replace(/\/+/g, '/');
        // Ensure prefix ends with / for proper S3 listing
        if (!prefix.endsWith('/')) prefix += '/';
        
        console.log('Listing files with prefix:', prefix);
        
        const response = await s3Client.send(new ListObjectsV2Command({
            Bucket: BUCKET, Prefix: prefix, Delimiter: '/'
        }));

        const folders = (response.CommonPrefixes || []).map(p => ({
            name: p.Prefix.replace(prefix, '').replace(/\/$/, ''),
            type: 'folder'
        })).filter(f => f.name && f.name !== '.keep');

        const files = (response.Contents || [])
            .filter(obj => !obj.Key.endsWith('/.keep') && obj.Key !== prefix)
            .map(obj => ({
                name: obj.Key.split('/').pop(),
                type: 'file',
                size: obj.Size,
                modified: obj.LastModified,
                key: obj.Key,
                path: obj.Key
            }));

        res.json({ folders, files, currentPath: folder });
    } catch (error) {
        console.error('List files error:', error);
        res.status(500).json({ error: 'Failed to list files' });
    }
});

// Get desktop items (files in Desktop folder)
app.get('/api/desktop', authenticateToken, async (req, res) => {
    try {
        const prefix = `${getUserPrefix(req.user.email)}/files/Desktop/`;
        
        const response = await s3Client.send(new ListObjectsV2Command({
            Bucket: BUCKET, Prefix: prefix, Delimiter: '/'
        }));

        const items = (response.Contents || [])
            .filter(obj => !obj.Key.endsWith('/.keep') && obj.Key !== prefix)
            .map(obj => {
                const name = obj.Key.split('/').pop();
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
                return {
                    name,
                    type: isImage ? 'image' : 'file',
                    size: obj.Size,
                    modified: obj.LastModified,
                    key: obj.Key,
                    path: obj.Key
                };
            });

        res.json({ items });
    } catch (error) {
        console.error('Desktop items error:', error);
        res.status(500).json({ error: 'Failed to get desktop items' });
    }
});

app.post('/api/files/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        
        const folder = req.query.folder || req.body.folder || '';
        console.log('Upload to folder:', folder, 'File:', req.file.originalname);
        const key = `${getUserPrefix(req.user.email)}/files/${folder}/${req.file.originalname}`.replace(/\/+/g, '/');
        
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET, Key: key, Body: req.file.buffer, ContentType: req.file.mimetype
        }));

        res.json({ message: 'File uploaded', key });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Get signed URL for file (for thumbnails)
app.get('/api/files/url', authenticateToken, async (req, res) => {
    try {
        const { path } = req.query;
        if (!path) return res.status(400).json({ error: 'Path is required' });
        
        // Verify user has access to this file
        if (!path.startsWith(getUserPrefix(req.user.email))) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const url = await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: BUCKET, Key: path }), { expiresIn: 3600 });
        res.json({ url });
    } catch (error) {
        console.error('Get file URL error:', error);
        res.status(500).json({ error: 'Failed to get file URL' });
    }
});

app.get('/api/files/download', authenticateToken, async (req, res) => {
    try {
        const { key } = req.query;
        if (!key || !key.startsWith(getUserPrefix(req.user.email))) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const url = await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 3600 });
        res.json({ url });
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to generate download URL' });
    }
});

app.delete('/api/files', authenticateToken, async (req, res) => {
    try {
        const { key, path, type } = req.body;
        const userPrefix = getUserPrefix(req.user.email);
        
        // Support both full key and relative path
        let targetKey;
        if (key && key.startsWith(userPrefix)) {
            targetKey = key;
        } else if (path) {
            // Build full key from relative path
            targetKey = `${userPrefix}/files/${path}`.replace(/\/+/g, '/');
        } else {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Verify the key belongs to this user
        if (!targetKey.startsWith(userPrefix)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        if (type === 'folder') {
            // Delete all objects in the folder
            const listResult = await s3Client.send(new ListObjectsV2Command({
                Bucket: BUCKET,
                Prefix: targetKey.endsWith('/') ? targetKey : targetKey + '/'
            }));
            
            if (listResult.Contents && listResult.Contents.length > 0) {
                for (const obj of listResult.Contents) {
                    await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: obj.Key }));
                }
            }
        } else {
            await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: targetKey }));
        }
        
        res.json({ message: 'File deleted' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// Move file between folders
app.post('/api/files/move', authenticateToken, async (req, res) => {
    try {
        const { sourceKey, destinationFolder } = req.body;
        const userPrefix = getUserPrefix(req.user.email);
        
        if (!sourceKey || !sourceKey.startsWith(userPrefix)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const fileName = sourceKey.split('/').pop();
        const destKey = `${userPrefix}/files/${destinationFolder}/${fileName}`.replace(/\/+/g, '/');
        
        // Don't move if source and destination are the same
        if (sourceKey === destKey) {
            return res.json({ message: 'File already in destination', newKey: destKey });
        }
        
        console.log('Moving file from:', sourceKey, 'to:', destKey);
        
        // First try to find the exact file - if character encoding issues, search for similar file
        let actualSourceKey = sourceKey;
        try {
            // List files in source folder to find exact match
            const sourceFolder = sourceKey.substring(0, sourceKey.lastIndexOf('/') + 1);
            const targetFileName = fileName;
            
            const listResult = await s3Client.send(new ListObjectsV2Command({
                Bucket: BUCKET,
                Prefix: sourceFolder
            }));
            
            // Find matching file (handle Unicode normalization issues)
            // Replace various whitespace characters with regular space for comparison
            // Also handle double-encoded UTF-8 characters (â¯ = corrupted \u202F)
            const normalizeStr = (s) => {
                return s.normalize('NFC')
                    .replace(/\u202F/g, ' ')   // narrow no-break space
                    .replace(/\u00A0/g, ' ')   // non-breaking space
                    .replace(/\u2009/g, ' ')   // thin space
                    .replace(/\u200B/g, '')    // zero-width space
                    .replace(/\uFEFF/g, '')    // BOM
                    .replace(/\u00E2\u0080\u00AF/g, ' ')  // double-encoded narrow no-break space (â¯)
                    .replace(/\s+/g, ' ');     // collapse multiple spaces
            };
            
            const matchingFile = listResult.Contents?.find(obj => {
                const objName = obj.Key.split('/').pop();
                return normalizeStr(objName) === normalizeStr(targetFileName);
            });
            
            if (matchingFile) {
                actualSourceKey = matchingFile.Key;
            }
        } catch (listErr) {
            // If listing fails, continue with provided key
        }
        
        // Copy the file to new location - CopySource must be URL-encoded
        await s3Client.send(new CopyObjectCommand({
            Bucket: BUCKET,
            CopySource: encodeURIComponent(`${BUCKET}/${actualSourceKey}`),
            Key: destKey
        }));
        
        // Delete the original
        await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: actualSourceKey }));
        
        res.json({ message: 'File moved', newKey: destKey });
    } catch (error) {
        console.error('Move error:', error);
        res.status(500).json({ error: 'Failed to move file' });
    }
});

app.post('/api/files/folder', authenticateToken, async (req, res) => {
    try {
        const { path: folderPath } = req.body;
        const key = `${getUserPrefix(req.user.email)}/files/${folderPath}/.keep`.replace(/\/+/g, '/');
        
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET, Key: key, Body: '', ContentType: 'text/plain'
        }));

        res.json({ message: 'Folder created' });
    } catch (error) {
        console.error('Create folder error:', error);
        res.status(500).json({ error: 'Failed to create folder' });
    }
});

// ==================== WALLPAPER ROUTES ====================

// System wallpapers (available to all users)
app.get('/api/wallpapers/system', authenticateToken, async (req, res) => {
    try {
        const response = await s3Client.send(new ListObjectsV2Command({ 
            Bucket: BUCKET, 
            Prefix: 'system/wallpapers/' 
        }));
        
        const wallpapers = await Promise.all(
            (response.Contents || [])
                .filter(obj => !obj.Key.endsWith('/') && !obj.Key.endsWith('.keep'))
                .map(async (obj) => {
                    const url = await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: BUCKET, Key: obj.Key }), { expiresIn: 86400 });
                    const name = obj.Key.split('/').pop().replace(/\.[^.]+$/, '').replace(/-/g, ' ');
                    return {
                        id: obj.Key,
                        name: name.charAt(0).toUpperCase() + name.slice(1),
                        url: url,
                        key: obj.Key
                    };
                })
        );
        
        res.json(wallpapers);
    } catch (error) {
        console.error('System wallpapers error:', error);
        res.status(500).json({ error: 'Failed to get system wallpapers' });
    }
});

app.get('/api/wallpapers', authenticateToken, async (req, res) => {
    try {
        const prefix = `${getUserPrefix(req.user.email)}/wallpapers/`;
        const response = await s3Client.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix }));
        
        const userWallpapers = (response.Contents || [])
            .filter(obj => !obj.Key.endsWith('/.keep'))
            .map(obj => ({
                id: obj.Key,
                name: obj.Key.split('/').pop(),
                key: obj.Key,
                isCustom: true
            }));

        res.json({ default: defaultWallpapers, custom: userWallpapers });
    } catch (error) {
        console.error('Wallpapers error:', error);
        res.status(500).json({ error: 'Failed to get wallpapers' });
    }
});

// User wallpapers with signed URLs
app.get('/api/wallpapers/user', authenticateToken, async (req, res) => {
    try {
        const prefix = `${getUserPrefix(req.user.email)}/wallpapers/`;
        const response = await s3Client.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix }));
        
        const wallpapers = await Promise.all(
            (response.Contents || [])
                .filter(obj => !obj.Key.endsWith('/.keep') && !obj.Key.endsWith('/'))
                .map(async (obj) => {
                    const url = await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: BUCKET, Key: obj.Key }), { expiresIn: 86400 });
                    return {
                        id: obj.Key,
                        name: obj.Key.split('/').pop(),
                        key: obj.Key,
                        url: url,
                        isCustom: true
                    };
                })
        );

        res.json(wallpapers);
    } catch (error) {
        console.error('User wallpapers error:', error);
        res.status(500).json({ error: 'Failed to get user wallpapers' });
    }
});

app.post('/api/wallpapers/upload', authenticateToken, upload.single('wallpaper'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        
        const key = `${getUserPrefix(req.user.email)}/wallpapers/${Date.now()}-${req.file.originalname}`;
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET, Key: key, Body: req.file.buffer, ContentType: req.file.mimetype
        }));

        const url = await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 86400 });
        res.json({ message: 'Wallpaper uploaded', key, url });
    } catch (error) {
        console.error('Wallpaper upload error:', error);
        res.status(500).json({ error: 'Failed to upload wallpaper' });
    }
});

app.get('/api/wallpapers/url', authenticateToken, async (req, res) => {
    try {
        const key = req.query.key;
        // Allow access to user's own wallpapers OR system wallpapers
        if (!key || (!key.startsWith(getUserPrefix(req.user.email)) && !key.startsWith('system/wallpapers/'))) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const url = await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 86400 });
        res.json({ url });
    } catch (error) {
        console.error('Wallpaper URL error:', error);
        res.status(500).json({ error: 'Failed to get wallpaper URL' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`HoverCam API running on port ${PORT}`);
    console.log(`S3 Bucket: ${BUCKET}`);
});
