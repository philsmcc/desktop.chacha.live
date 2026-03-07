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
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

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
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB for PDFs
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
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

// Bedrock Client for AI Chat
const bedrockClient = new BedrockRuntimeClient({
    region: process.env.AWS_BEDROCK_REGION || 'us-west-2',
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

// Admin-only middleware - must be used AFTER authenticateToken
const requireAdmin = async (req, res, next) => {
    try {
        // Check is_super_admin from JWT first (for speed)
        if (req.user.is_super_admin) {
            return next();
        }
        // Double-check against database for security
        const result = await pool.query('SELECT is_super_admin FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length > 0 && result.rows[0].is_super_admin) {
            return next();
        }
        return res.status(403).json({ error: 'Admin access required' });
    } catch (error) {
        console.error('Admin check error:', error);
        return res.status(500).json({ error: 'Authorization check failed' });
    }
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

        const token = jwt.sign({ email: emailLower, id: user.id, is_super_admin: user.is_super_admin || false }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        await pool.query('UPDATE users SET updated_at = NOW() WHERE id = $1', [user.id]);
        
        // Get organization info from email domain
        const orgDomain = getOrgDomain(user.email);
        
        res.json({ 
            message: 'Login successful', 
            token, 
            user: { 
                email: user.email,
                displayName: user.display_name || '',
                title: user.title || '',
                organization: orgDomain ? { domain: orgDomain, hasSharedFolder: true } : null,
                isSuperAdmin: user.is_super_admin || false,
                subscriptionTier: user.subscription_tier || 'free'
            } 
        });
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

// ==================== PROFILE ROUTES ====================

// Helper to get organization domain from email
const getOrgDomain = (email) => {
    const domain = email.split('@')[1];
    // TODO: Later, exclude common public email providers from shared folders
    // const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'protonmail.com'];
    // if (publicDomains.includes(domain.toLowerCase())) {
    //     return null;
    // }
    return domain.toLowerCase();
};

// Helper to get shared folder prefix for an organization
const getSharedPrefix = (domain) => `shared/${domain.replace(/\./g, '_')}/files/`;

// Get user profile (stored in database)
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT email, display_name, title, created_at FROM users WHERE email = $1',
            [req.user.email]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = result.rows[0];
        const orgDomain = getOrgDomain(user.email);
        
        res.json({
            email: user.email,
            displayName: user.display_name || '',
            title: user.title || '',
            createdAt: user.created_at,
            organization: orgDomain ? {
                domain: orgDomain,
                hasSharedFolder: true
            } : null
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// Update user profile (stored in database)
app.put('/api/profile', authenticateToken, async (req, res) => {
    try {
        const { displayName, title } = req.body;
        
        // Ensure columns exist (one-time migration)
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='display_name') THEN
                    ALTER TABLE users ADD COLUMN display_name VARCHAR(100);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='title') THEN
                    ALTER TABLE users ADD COLUMN title VARCHAR(100);
                END IF;
            END $$;
        `);
        
        await pool.query(
            'UPDATE users SET display_name = $1, title = $2, updated_at = NOW() WHERE email = $3',
            [displayName || null, title || null, req.user.email]
        );
        
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// ==================== SHARED FOLDER ROUTES ====================

// List shared folder contents
app.get('/api/shared', authenticateToken, async (req, res) => {
    try {
        const orgDomain = getOrgDomain(req.user.email);
        
        if (!orgDomain) {
            return res.json({ 
                available: false, 
                message: 'Shared folders are available for organization email addresses',
                folders: [],
                files: []
            });
        }
        
        const folder = req.query.folder || '';
        let prefix = `${getSharedPrefix(orgDomain)}${folder}`.replace(/\/+/g, '/');
        if (!prefix.endsWith('/')) prefix += '/';
        
        // Create shared folder structure if it doesn't exist
        try {
            await s3Client.send(new PutObjectCommand({
                Bucket: BUCKET,
                Key: `${getSharedPrefix(orgDomain)}.keep`,
                Body: '',
                ContentType: 'text/plain'
            }));
        } catch (e) { /* ignore */ }
        
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
        
        res.json({ 
            available: true,
            organization: orgDomain,
            folders, 
            files, 
            currentPath: folder 
        });
    } catch (error) {
        console.error('List shared files error:', error);
        res.status(500).json({ error: 'Failed to list shared files' });
    }
});

// Upload to shared folder
app.post('/api/shared/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const orgDomain = getOrgDomain(req.user.email);
        
        if (!orgDomain) {
            return res.status(403).json({ error: 'Shared folders require organization email' });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const folder = req.body.folder || '';
        const key = `${getSharedPrefix(orgDomain)}${folder}/${req.file.originalname}`.replace(/\/+/g, '/');
        
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        }));
        
        res.json({ message: 'File uploaded to shared folder', key });
    } catch (error) {
        console.error('Shared upload error:', error);
        res.status(500).json({ error: 'Failed to upload to shared folder' });
    }
});

// Create folder in shared space
app.post('/api/shared/folder', authenticateToken, async (req, res) => {
    try {
        const orgDomain = getOrgDomain(req.user.email);
        
        if (!orgDomain) {
            return res.status(403).json({ error: 'Shared folders require organization email' });
        }
        
        const { path, name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Folder name is required' });
        }
        
        const folderPath = path ? `${path}/${name}` : name;
        const key = `${getSharedPrefix(orgDomain)}${folderPath}/.keep`;
        
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: '',
            ContentType: 'text/plain'
        }));
        
        res.json({ message: 'Shared folder created', path: folderPath });
    } catch (error) {
        console.error('Create shared folder error:', error);
        res.status(500).json({ error: 'Failed to create shared folder' });
    }
});

// Move file to shared folder
app.post('/api/shared/move', authenticateToken, async (req, res) => {
    try {
        const orgDomain = getOrgDomain(req.user.email);
        
        if (!orgDomain) {
            return res.status(403).json({ error: 'Shared folders require organization email' });
        }
        
        const { sourceKey, destinationFolder } = req.body;
        if (!sourceKey) {
            return res.status(400).json({ error: 'Source key is required' });
        }
        
        const sharedPrefix = getSharedPrefix(orgDomain);
        const fileName = sourceKey.split('/').pop();
        const destKey = destinationFolder 
            ? `${sharedPrefix}${destinationFolder}/${fileName}`
            : `${sharedPrefix}${fileName}`;
        
        // Copy file to shared folder
        await s3Client.send(new CopyObjectCommand({
            Bucket: BUCKET,
            CopySource: `${BUCKET}/${sourceKey}`,
            Key: destKey
        }));
        
        // Delete original
        await s3Client.send(new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: sourceKey
        }));
        
        res.json({ message: 'File moved to shared folder', key: destKey });
    } catch (error) {
        console.error('Shared move error:', error);
        res.status(500).json({ error: 'Failed to move file to shared folder' });
    }
});

// Move file from shared folder to user's folder
// Copy file from shared folder to user's folder (keeps original in shared)
app.post('/api/shared/copy-to-user', authenticateToken, async (req, res) => {
    try {
        const orgDomain = getOrgDomain(req.user.email);
        
        if (!orgDomain) {
            return res.status(403).json({ error: 'Shared folders require organization email' });
        }
        
        const { sourceKey, destinationFolder } = req.body;
        if (!sourceKey) {
            return res.status(400).json({ error: 'Source key is required' });
        }
        
        const sharedPrefix = getSharedPrefix(orgDomain);
        
        // Verify source is in shared folder
        if (!sourceKey.startsWith(sharedPrefix.replace(/\/$/, ''))) {
            return res.status(403).json({ error: 'Source file is not in shared folder' });
        }
        
        const userPrefix = getUserPrefix(req.user.email);
        const fileName = sourceKey.split('/').pop();
        const destKey = `${userPrefix}/files/${destinationFolder}/${fileName}`.replace(/\/+/g, '/');
        
        // Copy file to user's folder (keep original in shared folder)
        await s3Client.send(new CopyObjectCommand({
            Bucket: BUCKET,
            CopySource: `${BUCKET}/${sourceKey}`,
            Key: destKey
        }));
        
        res.json({ message: 'File copied from shared folder', key: destKey });
    } catch (error) {
        console.error('Shared copy-to-user error:', error);
        res.status(500).json({ error: 'Failed to copy file from shared folder' });
    }
});

// Delete from shared folder
app.delete('/api/shared', authenticateToken, async (req, res) => {
    try {
        const orgDomain = getOrgDomain(req.user.email);
        
        if (!orgDomain) {
            return res.status(403).json({ error: 'Shared folders require organization email' });
        }
        
        const { key, path, type } = req.body;
        const sharedPrefix = getSharedPrefix(orgDomain);
        
        // Determine the full key
        let fullKey = key;
        if (!fullKey && path) {
            fullKey = `${sharedPrefix}${path}`;
        }
        
        // Security check - ensure the key belongs to this org's shared folder
        if (!fullKey || !fullKey.startsWith(sharedPrefix.replace(/\/$/, ''))) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        if (type === 'folder') {
            // Delete all contents in the folder
            const prefix = fullKey.endsWith('/') ? fullKey : fullKey + '/';
            const listResponse = await s3Client.send(new ListObjectsV2Command({
                Bucket: BUCKET, Prefix: prefix
            }));
            
            if (listResponse.Contents && listResponse.Contents.length > 0) {
                for (const obj of listResponse.Contents) {
                    await s3Client.send(new DeleteObjectCommand({
                        Bucket: BUCKET, Key: obj.Key
                    }));
                }
            }
        } else {
            await s3Client.send(new DeleteObjectCommand({
                Bucket: BUCKET, Key: fullKey
            }));
        }
        
        res.json({ message: 'Deleted from shared folder' });
    } catch (error) {
        console.error('Delete from shared error:', error);
        res.status(500).json({ error: 'Failed to delete from shared folder' });
    }
});

// Get signed URL for shared file
app.get('/api/shared/url', authenticateToken, async (req, res) => {
    try {
        const orgDomain = getOrgDomain(req.user.email);
        
        if (!orgDomain) {
            return res.status(403).json({ error: 'Shared folders require organization email' });
        }
        
        const { key, path } = req.query;
        const sharedPrefix = getSharedPrefix(orgDomain);
        
        let fullKey = key;
        if (!fullKey && path) {
            // Check if path already includes the shared prefix
            if (path.startsWith('shared/')) {
                fullKey = path;
            } else {
                fullKey = `${sharedPrefix}${path}`;
            }
        }
        
        // Security check - ensure the key belongs to this org's shared folder
        const expectedPrefix = sharedPrefix.replace(/\/$/, '');
        if (!fullKey || !fullKey.startsWith(expectedPrefix)) {
            console.log('Access denied - fullKey:', fullKey, 'expectedPrefix:', expectedPrefix);
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const url = await getSignedUrl(s3Client, new GetObjectCommand({
            Bucket: BUCKET, Key: fullKey
        }), { expiresIn: 3600 });
        
        res.json({ url });
    } catch (error) {
        console.error('Get shared URL error:', error);
        res.status(500).json({ error: 'Failed to get URL' });
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
// ==================== ADMIN API ROUTES ====================

// Get all users (admin only)
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { domain, tier, search, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT id, username, email, display_name, title, email_verified, 
                   is_super_admin, subscription_tier, subscription_expires_at,
                   created_at, updated_at
            FROM users
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;
        
        if (domain) {
            query += ` AND email LIKE $${paramIndex}`;
            params.push(`%@${domain}`);
            paramIndex++;
        }
        
        if (tier) {
            query += ` AND subscription_tier = $${paramIndex}`;
            params.push(tier);
            paramIndex++;
        }
        
        if (search) {
            query += ` AND (email ILIKE $${paramIndex} OR display_name ILIKE $${paramIndex} OR username ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        
        // Get total count
        const countResult = await pool.query(
            query.replace('SELECT id, username, email, display_name, title, email_verified, is_super_admin, subscription_tier, subscription_expires_at, created_at, updated_at', 'SELECT COUNT(*)'),
            params
        );
        const total = parseInt(countResult.rows[0].count);
        
        // Get paginated results
        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);
        
        const result = await pool.query(query, params);
        
        res.json({
            users: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Admin get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// Get user stats by domain (admin only)
app.get('/api/admin/domains', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                SUBSTRING(email FROM POSITION('@' IN email) + 1) as domain,
                COUNT(*) as user_count,
                COUNT(*) FILTER (WHERE subscription_tier = 'premium') as premium_count,
                COUNT(*) FILTER (WHERE subscription_tier = 'free') as free_count,
                MIN(created_at) as first_user_at,
                MAX(created_at) as last_user_at
            FROM users
            GROUP BY SUBSTRING(email FROM POSITION('@' IN email) + 1)
            ORDER BY user_count DESC
        `);
        
        // Get domain subscriptions
        const domainSubs = await pool.query('SELECT * FROM domain_subscriptions ORDER BY domain');
        
        res.json({
            domains: result.rows,
            domainSubscriptions: domainSubs.rows
        });
    } catch (error) {
        console.error('Admin get domains error:', error);
        res.status(500).json({ error: 'Failed to get domain stats' });
    }
});

// Update user (admin only)
app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { subscription_tier, subscription_expires_at, is_super_admin, display_name, title } = req.body;
        
        const updates = [];
        const params = [];
        let paramIndex = 1;
        
        if (subscription_tier !== undefined) {
            updates.push(`subscription_tier = $${paramIndex}`);
            params.push(subscription_tier);
            paramIndex++;
        }
        
        if (subscription_expires_at !== undefined) {
            updates.push(`subscription_expires_at = $${paramIndex}`);
            params.push(subscription_expires_at);
            paramIndex++;
        }
        
        if (is_super_admin !== undefined) {
            updates.push(`is_super_admin = $${paramIndex}`);
            params.push(is_super_admin);
            paramIndex++;
        }
        
        if (display_name !== undefined) {
            updates.push(`display_name = $${paramIndex}`);
            params.push(display_name);
            paramIndex++;
        }
        
        if (title !== undefined) {
            updates.push(`title = $${paramIndex}`);
            params.push(title);
            paramIndex++;
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        updates.push(`updated_at = NOW()`);
        params.push(id);
        
        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        const result = await pool.query(query, params);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User updated', user: result.rows[0] });
    } catch (error) {
        console.error('Admin update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user (admin only)
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Don't allow deleting yourself
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING email', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User deleted', email: result.rows[0].email });
    } catch (error) {
        console.error('Admin delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Set domain subscription (admin only)
app.put('/api/admin/domains/:domain', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { domain } = req.params;
        const { subscription_tier, max_users, contact_email, contact_name, notes, expires_at } = req.body;
        
        const result = await pool.query(`
            INSERT INTO domain_subscriptions (domain, subscription_tier, max_users, contact_email, contact_name, notes, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (domain) DO UPDATE SET
                subscription_tier = COALESCE($2, domain_subscriptions.subscription_tier),
                max_users = COALESCE($3, domain_subscriptions.max_users),
                contact_email = COALESCE($4, domain_subscriptions.contact_email),
                contact_name = COALESCE($5, domain_subscriptions.contact_name),
                notes = COALESCE($6, domain_subscriptions.notes),
                expires_at = COALESCE($7, domain_subscriptions.expires_at),
                updated_at = NOW()
            RETURNING *
        `, [domain, subscription_tier, max_users, contact_email, contact_name, notes, expires_at]);
        
        // Update all users on this domain to the new tier
        if (subscription_tier) {
            await pool.query(`
                UPDATE users SET subscription_tier = $1, subscription_expires_at = $2
                WHERE email LIKE $3
            `, [subscription_tier, expires_at, `%@${domain}`]);
        }
        
        res.json({ message: 'Domain subscription updated', domainSubscription: result.rows[0] });
    } catch (error) {
        console.error('Admin update domain error:', error);
        res.status(500).json({ error: 'Failed to update domain subscription' });
    }
});

// Get admin dashboard stats (admin only)
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(*) FILTER (WHERE subscription_tier = 'premium') as premium_users,
                COUNT(*) FILTER (WHERE subscription_tier = 'free') as free_users,
                COUNT(*) FILTER (WHERE is_super_admin = true) as admin_users,
                COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_week,
                COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_users_month,
                COUNT(DISTINCT SUBSTRING(email FROM POSITION('@' IN email) + 1)) as unique_domains
            FROM users
        `);
        
        const domainStats = await pool.query(`
            SELECT COUNT(*) as total_domain_subscriptions,
                   COUNT(*) FILTER (WHERE subscription_tier = 'premium') as premium_domains
            FROM domain_subscriptions
        `);
        
        res.json({
            ...stats.rows[0],
            ...domainStats.rows[0]
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// ============================================
// TERMINAL CHAT API (ChaCha AI Assistant)
// ============================================

// Get AI settings (for admin)
app.get('/api/admin/ai-settings', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT setting_key, setting_value FROM ai_settings');
        const settings = {};
        result.rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        res.json(settings);
    } catch (error) {
        console.error('Get AI settings error:', error);
        res.status(500).json({ error: 'Failed to get AI settings' });
    }
});

// Update AI settings (admin only)
app.put('/api/admin/ai-settings', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { system_prompt, model_id, max_tokens, temperature, product_info } = req.body;
        
        if (system_prompt !== undefined) {
            await pool.query(
                'UPDATE ai_settings SET setting_value = $1, updated_at = NOW(), updated_by = $2 WHERE setting_key = $3',
                [system_prompt, req.user.id, 'system_prompt']
            );
        }
        if (model_id !== undefined) {
            await pool.query(
                'UPDATE ai_settings SET setting_value = $1, updated_at = NOW(), updated_by = $2 WHERE setting_key = $3',
                [model_id, req.user.id, 'model_id']
            );
        }
        if (max_tokens !== undefined) {
            await pool.query(
                'UPDATE ai_settings SET setting_value = $1, updated_at = NOW(), updated_by = $2 WHERE setting_key = $3',
                [String(max_tokens), req.user.id, 'max_tokens']
            );
        }
        if (temperature !== undefined) {
            await pool.query(
                'UPDATE ai_settings SET setting_value = $1, updated_at = NOW(), updated_by = $2 WHERE setting_key = $3',
                [String(temperature), req.user.id, 'temperature']
            );
        }
        if (product_info !== undefined) {
            await pool.query(
                'UPDATE ai_settings SET setting_value = $1, updated_at = NOW(), updated_by = $2 WHERE setting_key = $3',
                [product_info, req.user.id, 'product_info']
            );
        }
        
        res.json({ message: 'AI settings updated' });
    } catch (error) {
        console.error('Update AI settings error:', error);
        res.status(500).json({ error: 'Failed to update AI settings' });
    }
});

// Helper to get user context from S3
async function getUserContext(userEmail) {
    const contextKey = `${getUserPrefix(userEmail)}/chat-context.json`;
    try {
        const response = await s3Client.send(new GetObjectCommand({
            Bucket: BUCKET,
            Key: contextKey
        }));
        const data = await response.Body.transformToString();
        return JSON.parse(data);
    } catch (error) {
        if (error.name === 'NoSuchKey') {
            return { 
                memories: [],
                conversationHistory: [],
                lastChat: null
            };
        }
        throw error;
    }
}

// Helper to save user context to S3
async function saveUserContext(userEmail, context) {
    const contextKey = `${getUserPrefix(userEmail)}/chat-context.json`;
    await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: contextKey,
        Body: JSON.stringify(context),
        ContentType: 'application/json'
    }));
}

// Chat endpoint
app.post('/api/chat', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get AI settings
        const settingsResult = await pool.query('SELECT setting_key, setting_value FROM ai_settings');
        const settings = {};
        settingsResult.rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });

        // Get user context
        const userContext = await getUserContext(req.user.email);
        
        // Get user info for personalization
        const userResult = await pool.query(
            'SELECT display_name, title FROM users WHERE email = $1',
            [req.user.email]
        );
        const userInfo = userResult.rows[0] || {};

        // Build context string from memories
        let memoryContext = '';
        if (userContext.memories && userContext.memories.length > 0) {
            memoryContext = '\n\nWhat you know about this teacher:\n' + 
                userContext.memories.slice(-20).map(m => `- ${m}`).join('\n');
        }

        // Build recent conversation history (last 10 exchanges)
        let recentHistory = '';
        if (userContext.conversationHistory && userContext.conversationHistory.length > 0) {
            const recent = userContext.conversationHistory.slice(-10);
            recentHistory = '\n\nRecent conversation:\n' + 
                recent.map(h => `${h.role}: ${h.content}`).join('\n');
        }

        // Build lesson history context (for suggesting what to learn next)
        let lessonHistoryContext = '';
        if (userContext.lessonHistory && userContext.lessonHistory.length > 0) {
            const recentLessons = userContext.lessonHistory.slice(0, 5);
            lessonHistoryContext = '\n\nRecent lessons this teacher has created:\n' + 
                recentLessons.map(l => `- ${l.subject} (${l.grade}): "${l.topic}" on ${new Date(l.date).toLocaleDateString()}`).join('\n') +
                '\n\nYou can suggest related topics or next lessons based on this history.';
        }

        // Build the full prompt
        const systemPrompt = settings.system_prompt || 'You are a helpful assistant.';
        const productInfo = settings.product_info || '';
        const userGreeting = userInfo.display_name ? `The teacher's name is ${userInfo.display_name}.` : '';
        
        const fullPrompt = `${systemPrompt}

${productInfo ? `\n${productInfo}\n` : ''}
${userGreeting}
${memoryContext}
${lessonHistoryContext}
${recentHistory}

User: ${message}
Assistant:`;

        // Call Bedrock model
        const modelId = settings.model_id || 'amazon.nova-lite-v1:0';
        const maxTokens = parseInt(settings.max_tokens) || 500;
        const temperature = parseFloat(settings.temperature) || 0.7;

        let requestBody;
        let assistantMessage;

        // Nova models use a different format than Titan
        if (modelId.includes('nova')) {
            // Amazon Nova format (uses messages API like Claude)
            requestBody = {
                messages: [
                    {
                        role: 'user',
                        content: [{ text: fullPrompt }]
                    }
                ],
                inferenceConfig: {
                    maxTokens: maxTokens,
                    temperature: temperature,
                    topP: 0.9
                }
            };
        } else {
            // Titan format
            requestBody = {
                inputText: fullPrompt,
                textGenerationConfig: {
                    maxTokenCount: maxTokens,
                    temperature: temperature,
                    topP: 0.9,
                    stopSequences: ['User:', '\n\nUser:']
                }
            };
        }

        const command = new InvokeModelCommand({
            modelId: modelId,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify(requestBody)
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        
        // Parse response based on model type
        if (modelId.includes('nova')) {
            assistantMessage = responseBody.output?.message?.content?.[0]?.text || 'I apologize, I had trouble responding. Could you try again?';
        } else {
            assistantMessage = responseBody.results?.[0]?.outputText || 'I apologize, I had trouble responding. Could you try again?';
        }
        
        // Clean up the response
        assistantMessage = assistantMessage.trim();

        // Extract any new memories from the conversation
        const newMemories = extractMemories(message, assistantMessage);
        if (newMemories.length > 0) {
            userContext.memories = [...(userContext.memories || []), ...newMemories];
            // Keep only last 50 memories
            if (userContext.memories.length > 50) {
                userContext.memories = userContext.memories.slice(-50);
            }
        }

        // Update conversation history
        userContext.conversationHistory = userContext.conversationHistory || [];
        userContext.conversationHistory.push(
            { role: 'User', content: message },
            { role: 'Assistant', content: assistantMessage }
        );
        // Keep only last 20 exchanges (40 messages)
        if (userContext.conversationHistory.length > 40) {
            userContext.conversationHistory = userContext.conversationHistory.slice(-40);
        }
        
        userContext.lastChat = new Date().toISOString();

        // Save updated context
        await saveUserContext(req.user.email, userContext);

        res.json({ 
            response: assistantMessage,
            memories: userContext.memories?.length || 0
        });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to process chat: ' + error.message });
    }
});

// Helper to extract memories from conversation
function extractMemories(userMessage, assistantResponse) {
    const memories = [];
    const lowerMessage = userMessage.toLowerCase();
    
    // Extract name mentions
    const namePatterns = [
        /my name is (\w+)/i,
        /i'm (\w+)/i,
        /call me (\w+)/i,
        /i am (\w+)/i
    ];
    for (const pattern of namePatterns) {
        const match = userMessage.match(pattern);
        if (match && match[1].length > 1 && !['a', 'the', 'an', 'not', 'very', 'just', 'so'].includes(match[1].toLowerCase())) {
            memories.push(`Teacher's name is ${match[1]}`);
        }
    }
    
    // Extract teaching info
    if (lowerMessage.includes('teach') && (lowerMessage.includes('grade') || lowerMessage.includes('subject') || lowerMessage.includes('class'))) {
        memories.push(`Teaching info: ${userMessage.slice(0, 100)}`);
    }
    
    // Extract school mentions
    if (lowerMessage.includes('school') || lowerMessage.includes('district')) {
        const schoolMatch = userMessage.match(/(?:at|in|from)\s+([A-Z][a-zA-Z\s]+(?:school|district|academy|elementary|middle|high))/i);
        if (schoolMatch) {
            memories.push(`Works at ${schoolMatch[1]}`);
        }
    }
    
    // Extract hobby/interest mentions
    if (lowerMessage.includes('i love') || lowerMessage.includes('i enjoy') || lowerMessage.includes('my hobby') || lowerMessage.includes('i like')) {
        memories.push(`Interest: ${userMessage.slice(0, 80)}`);
    }
    
    // Extract years of experience
    const yearsMatch = userMessage.match(/(\d+)\s*years?\s*(?:teaching|experience|in education)/i);
    if (yearsMatch) {
        memories.push(`Has ${yearsMatch[1]} years of teaching experience`);
    }
    
    return memories;
}

// Get chat context (for debugging/admin)
app.get('/api/chat/context', authenticateToken, async (req, res) => {
    try {
        const context = await getUserContext(req.user.email);
        res.json(context);
    } catch (error) {
        console.error('Get context error:', error);
        res.status(500).json({ error: 'Failed to get context' });
    }
});

// Clear chat context
app.delete('/api/chat/context', authenticateToken, async (req, res) => {
    try {
        await saveUserContext(req.user.email, {
            memories: [],
            conversationHistory: [],
            lastChat: null
        });
        res.json({ message: 'Chat context cleared' });
    } catch (error) {
        console.error('Clear context error:', error);
        res.status(500).json({ error: 'Failed to clear context' });
    }
});

// ===== LESSON PLANNER API =====

// Create lessons table if not exists
pool.query(`
    CREATE TABLE IF NOT EXISTS lesson_plans (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        subject VARCHAR(100),
        grade VARCHAR(50),
        topic VARCHAR(255),
        standard VARCHAR(255),
        duration VARCHAR(50),
        plan_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`).catch(err => console.error('Lesson plans table creation error:', err));

// Get lesson context from S3 + terminal context
app.get('/api/lesson/context', authenticateToken, async (req, res) => {
    try {
        const prefix = getUserPrefix(req.user.email);
        
        // Get ChaCha terminal context
        let terminalContext = null;
        try {
            const contextKey = `${prefix}/chacha-context.json`;
            const getCmd = new GetObjectCommand({ Bucket: BUCKET, Key: contextKey });
            const response = await s3Client.send(getCmd);
            const contextStr = await response.Body.transformToString();
            terminalContext = JSON.parse(contextStr);
        } catch (e) {
            // No terminal context yet
        }
        
        // Get recent lessons from database
        const lessonsResult = await pool.query(
            'SELECT subject, topic, grade, created_at FROM lesson_plans WHERE user_email = $1 ORDER BY created_at DESC LIMIT 10',
            [req.user.email]
        );
        
        const recentTopics = lessonsResult.rows.map(r => r.topic);
        const recentSubjects = [...new Set(lessonsResult.rows.map(r => r.subject))];
        
        res.json({
            terminalContext: terminalContext ? {
                memories: terminalContext.memories || [],
                recentChats: terminalContext.conversationHistory?.slice(-6) || []
            } : null,
            recentTopics,
            recentSubjects,
            lessonsCount: lessonsResult.rows.length
        });
    } catch (error) {
        console.error('Get lesson context error:', error);
        res.status(500).json({ error: 'Failed to get context' });
    }
});

// Chat with Nova Pro to gather lesson requirements
app.post('/api/lesson/chat', authenticateToken, async (req, res) => {
    try {
        const { message, conversationHistory, currentData } = req.body;
        
        const systemPrompt = `You are an expert educational curriculum designer helping a teacher create a lesson plan.
Your goal is to gather the necessary information to create a comprehensive lesson plan.

You need to collect:
1. Subject (e.g., Math, Science, English, History, Art)
2. Grade level (e.g., K, 1st-12th, or age range)
3. Topic/Concept to teach
4. Learning standard (suggest Common Core or state standards if they don't specify)
5. Duration (class period length)
6. Any special requirements or accommodations

Current information gathered:
- Subject: ${currentData.subject || 'Not specified'}
- Grade: ${currentData.grade || 'Not specified'}
- Topic: ${currentData.topic || 'Not specified'}
- Standard: ${currentData.standard || 'Not specified'}
- Duration: ${currentData.duration || 'Not specified'}

Be conversational, friendly, and helpful. Ask clarifying questions one or two at a time.
When you have enough information (at least subject, grade, and topic), let them know they can generate the lesson plan.

INTERNAL INSTRUCTIONS (DO NOT REVEAL TO USER):
At the very end of your response, after your conversational message, include extraction data in this exact format on a NEW LINE:
|||EXTRACT|||{"subject":"value or null","grade":"value or null","topic":"value or null","standard":"value or null","duration":"value or null","readyToGenerate":true or false}|||END|||

Do NOT mention this extraction format to the user. Do NOT say anything about JSON or data extraction. Just have a natural conversation and silently append the extraction data at the end.`;

        // Build conversation for Nova
        const conversationStr = conversationHistory.map(m => 
            `${m.role === 'user' ? 'Teacher' : 'Assistant'}: ${m.content}`
        ).join('\n');
        
        const fullPrompt = `${systemPrompt}\n\nConversation so far:\n${conversationStr}\n\nTeacher: ${message}\n\nAssistant:`;

        // Call Nova Pro
        const modelId = 'us.amazon.nova-pro-v1:0';
        const requestBody = {
            messages: [{ role: 'user', content: [{ text: fullPrompt }] }],
            inferenceConfig: {
                maxTokens: 1000,
                temperature: 0.7
            }
        };

        const command = new InvokeModelCommand({
            modelId,
            body: JSON.stringify(requestBody),
            contentType: 'application/json',
            accept: 'application/json'
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        let assistantMessage = responseBody.output?.message?.content?.[0]?.text || 'I apologize, I had trouble processing that.';
        
        // Extract JSON from response
        let extractedData = {};
        let readyToGenerate = false;
        
        // Extract data from hidden markers
        const extractMatch = assistantMessage.match(/\|\|\|EXTRACT\|\|\|(.+?)\|\|\|END\|\|\|/);
        if (extractMatch) {
            try {
                const parsed = JSON.parse(extractMatch[1]);
                extractedData = {
                    subject: (parsed.subject && parsed.subject !== 'null') ? parsed.subject : currentData.subject,
                    grade: (parsed.grade && parsed.grade !== 'null') ? parsed.grade : currentData.grade,
                    topic: (parsed.topic && parsed.topic !== 'null') ? parsed.topic : currentData.topic,
                    standard: (parsed.standard && parsed.standard !== 'null') ? parsed.standard : currentData.standard,
                    duration: (parsed.duration && parsed.duration !== 'null') ? parsed.duration : currentData.duration
                };
                readyToGenerate = parsed.readyToGenerate === true;
                // Remove extraction markers from displayed message
                assistantMessage = assistantMessage.replace(/\s*\|\|\|EXTRACT\|\|\|.+?\|\|\|END\|\|\|/, '').trim();
            } catch (e) {
                console.log('Extract parse error:', e);
                // Still try to remove the markers even if parse fails
                assistantMessage = assistantMessage.replace(/\s*\|\|\|EXTRACT\|\|\|.+?\|\|\|END\|\|\|/, '').trim();
            }
        }
        
        console.log('Lesson chat - extractedData:', extractedData);
        console.log('Lesson chat - readyToGenerate:', readyToGenerate);
        
        res.json({
            message: assistantMessage,
            extractedData,
            readyToGenerate
        });
        
    } catch (error) {
        console.error('Lesson chat error:', error);
        res.status(500).json({ error: 'Failed to process chat: ' + error.message });
    }
});

// Generate full lesson plan with Claude Opus
app.post('/api/lesson/generate', authenticateToken, async (req, res) => {
    try {
        const { lessonData, conversationHistory } = req.body;
        
        // Get terminal context for teacher info
        let teacherInfo = '';
        try {
            const prefix = getUserPrefix(req.user.email);
            const contextKey = `${prefix}/chacha-context.json`;
            const getCmd = new GetObjectCommand({ Bucket: BUCKET, Key: contextKey });
            const response = await s3Client.send(getCmd);
            const contextStr = await response.Body.transformToString();
            const ctx = JSON.parse(contextStr);
            if (ctx.memories && ctx.memories.length > 0) {
                teacherInfo = 'Known information about this teacher: ' + ctx.memories.join('; ');
            }
        } catch (e) {
            // No context
        }

        const systemPrompt = `You are an expert educational curriculum designer creating a comprehensive, engaging lesson plan.

Create a detailed lesson plan with the following structure (respond in valid JSON format):

{
  "title": "Engaging lesson title",
  "overview": "Brief 2-3 sentence overview of what students will learn",
  "objectives": [
    "Students will be able to...",
    "Students will understand...",
    "Students will demonstrate..."
  ],
  "materials": [
    "List of materials needed"
  ],
  "introduction": "5-10 minute hook/attention grabber - make it engaging and relevant to students' lives",
  "directInstruction": {
    "duration": "15-20 minutes",
    "content": "Main teaching content with clear explanations",
    "keyPoints": ["Point 1", "Point 2"],
    "examples": ["Real-world example 1", "Example 2"]
  },
  "guidedPractice": {
    "duration": "10-15 minutes",
    "activities": ["Activity description with step-by-step instructions"],
    "checkpoints": ["How to check for understanding"]
  },
  "independentPractice": {
    "duration": "10-15 minutes",
    "activities": ["Independent work activity"],
    "extensions": ["For students who finish early"]
  },
  "discussion": [
    "Thought-provoking discussion question 1",
    "Discussion question 2",
    "Discussion question 3"
  ],
  "funFacts": [
    "Interesting fact related to the topic",
    "Another engaging fact",
    "Mind-blowing fact students will love"
  ],
  "assessment": {
    "formative": ["How to assess during the lesson"],
    "summative": ["End of lesson assessment ideas"],
    "exitTicket": "Quick question to check understanding"
  },
  "closure": "How to wrap up the lesson effectively",
  "blendedLearning": {
    "mathConnections": "How to incorporate math if applicable",
    "scienceConnections": "How to incorporate science if applicable",
    "historyConnections": "How to incorporate history if applicable",
    "technologyIntegration": "Digital tools or resources to enhance learning",
    "artConnections": "Creative expression opportunities"
  },
  "differentiation": {
    "struggling": ["Supports for struggling learners"],
    "advanced": ["Extensions for advanced learners"],
    "ell": ["Support for English Language Learners"],
    "accommodations": ["General accommodations"]
  },
  "standards": {
    "primaryStandard": "The main standard addressed",
    "relatedStandards": ["Other standards touched on"]
  },
  "imagePrompts": [
    "Description of a helpful diagram to generate",
    "Description of an illustration that would help",
    "Description of a visual aid"
  ]
}

Make the lesson:
1. Age-appropriate and engaging for the grade level
2. Include real-world connections
3. Incorporate opportunities for blended learning (connecting subjects)
4. Include fun facts that will capture student interest
5. Provide clear, actionable instructions for each section
6. Include differentiation strategies

IMPORTANT FORMATTING RULES:
- All sentences must start with a capital letter
- All bold/emphasized words at the start of sentences must be capitalized
- Use proper grammar and punctuation throughout
- Keep content professional and polished for educators

${teacherInfo}
`;

        const userPrompt = `Create a comprehensive lesson plan with these requirements:

Subject: ${lessonData.subject}
Grade Level: ${lessonData.grade}
Topic: ${lessonData.topic}
Standard: ${lessonData.standard || 'Please suggest an appropriate standard'}
Duration: ${lessonData.duration || '45-50 minutes'}

Additional context from our conversation:
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n').slice(-2000)}

Please create an engaging, comprehensive lesson plan in the JSON format specified.`;

        // Use Claude Opus 4.6 via cross-region inference
        const modelId = 'us.anthropic.claude-sonnet-4-5-20250929-v1:0';
        
        const requestBody = {
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 8000,
            temperature: 0.7,
            messages: [
                { role: 'user', content: systemPrompt + '\n\n' + userPrompt }
            ]
        };

        const command = new InvokeModelCommand({
            modelId,
            body: JSON.stringify(requestBody),
            contentType: 'application/json',
            accept: 'application/json'
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const assistantMessage = responseBody.content?.[0]?.text || '';
        
        // Parse JSON from response
        let lessonPlan = {};
        try {
            // Try to find JSON in the response
            const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                lessonPlan = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('Failed to parse lesson plan JSON:', e);
            // Create a basic structure from text
            lessonPlan = {
                title: lessonData.topic,
                overview: assistantMessage.slice(0, 500),
                error: 'Could not parse structured response'
            };
        }
        
        // Save to database
        await pool.query(
            `INSERT INTO lesson_plans (user_email, subject, grade, topic, standard, duration, plan_data) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [req.user.email, lessonData.subject, lessonData.grade, lessonData.topic, 
             lessonData.standard, lessonData.duration, JSON.stringify(lessonPlan)]
        );
        
        // Update teacher context with lesson metadata (shared with ChaCha terminal)
        try {
            const prefix = getUserPrefix(req.user.email);
            
            // Update the ChaCha context file so terminal can access lesson history
            const chachaContextKey = `${prefix}/chacha-context.json`;
            let chachaContext = { memories: [], conversationHistory: [], lessonHistory: [] };
            
            try {
                const getCmd = new GetObjectCommand({ Bucket: BUCKET, Key: chachaContextKey });
                const response = await s3Client.send(getCmd);
                const contextStr = await response.Body.transformToString();
                chachaContext = JSON.parse(contextStr);
            } catch (e) {}
            
            // Add lesson metadata (NOT the full plan, just details)
            const lessonMeta = {
                subject: lessonData.subject,
                grade: lessonData.grade,
                topic: lessonData.topic,
                standard: lessonData.standard,
                duration: lessonData.duration,
                title: lessonPlan.title,
                objectives: lessonPlan.objectives?.slice(0, 3) || [], // Just first 3 objectives
                date: new Date().toISOString()
            };
            
            // Keep lesson history (last 20 lessons)
            chachaContext.lessonHistory = [lessonMeta, ...(chachaContext.lessonHistory || [])].slice(0, 20);
            
            // Add a memory about this lesson for ChaCha to reference
            const lessonMemory = `Teacher created a ${lessonData.grade} ${lessonData.subject} lesson on "${lessonData.topic}" on ${new Date().toLocaleDateString()}`;
            if (!chachaContext.memories.includes(lessonMemory)) {
                chachaContext.memories = [lessonMemory, ...(chachaContext.memories || [])].slice(0, 50);
            }
            
            await s3Client.send(new PutObjectCommand({
                Bucket: BUCKET,
                Key: chachaContextKey,
                Body: JSON.stringify(chachaContext),
                ContentType: 'application/json'
            }));
        } catch (e) {
            console.log('Failed to update lesson context:', e);
        }
        
        res.json({ lessonPlan });
        
    } catch (error) {
        console.error('Lesson generate error:', error);
        res.status(500).json({ error: 'Failed to generate lesson plan: ' + error.message });
    }
});

// Get lesson history
app.get('/api/lesson/history', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, subject, grade, topic, created_at FROM lesson_plans WHERE user_email = $1 ORDER BY created_at DESC LIMIT 20',
            [req.user.email]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Lesson history error:', error);
        res.status(500).json({ error: 'Failed to get history' });
    }
});

// Get specific lesson
app.get('/api/lesson/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM lesson_plans WHERE id = $1 AND user_email = $2',
            [req.params.id, req.user.email]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lesson not found' });
        }
        const lesson = result.rows[0];
        res.json({
            plan: lesson.plan_data,
            data: {
                subject: lesson.subject,
                grade: lesson.grade,
                topic: lesson.topic,
                standard: lesson.standard,
                duration: lesson.duration
            }
        });
    } catch (error) {
        console.error('Get lesson error:', error);
        res.status(500).json({ error: 'Failed to get lesson' });
    }
});

// Export lesson to PDF
app.post('/api/lesson/export-pdf', authenticateToken, async (req, res) => {
    try {
        const { lessonPlan, includedSections, options } = req.body;
        
        // Generate HTML for PDF
        const html = generateLessonPDF(lessonPlan, includedSections, options);
        
        // For now, return HTML - can use puppeteer or similar for actual PDF
        const prefix = getUserPrefix(req.user.email);
        const pdfKey = `${prefix}/lessons/${lessonPlan.title?.replace(/[^a-z0-9]/gi, '_') || 'lesson'}_${Date.now()}.html`;
        
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: pdfKey,
            Body: html,
            ContentType: 'text/html'
        }));
        
        const getCmd = new GetObjectCommand({ Bucket: BUCKET, Key: pdfKey });
        const previewUrl = await getSignedUrl(s3Client, getCmd, { expiresIn: 3600 });
        
        res.json({
            previewUrl,
            downloadUrl: previewUrl
        });
    } catch (error) {
        console.error('PDF export error:', error);
        res.status(500).json({ error: 'Failed to export PDF' });
    }
});

// Helper function to generate PDF HTML
function generateLessonPDF(plan, includedSections, options) {
    const sections = [];
    
    // Convert camelCase to Title Case
    const camelToTitle = (str) => {
        return str.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
    };
    
    // Helper to add section if included
    const addSection = (key, title, content) => {
        if (!includedSections || includedSections[key]) {
            sections.push(`
                <div class="section">
                    <h2>${title}</h2>
                    <div class="section-content">${formatContent(content)}</div>
                </div>
            `);
        }
    };
    
    const formatContent = (content) => {
        if (Array.isArray(content)) {
            return '<ul>' + content.map(item => `<li>${item}</li>`).join('') + '</ul>';
        }
        if (typeof content === 'object' && content !== null) {
            return Object.entries(content).map(([key, value]) => 
                `<p><strong>${camelToTitle(key)}:</strong> ${Array.isArray(value) ? value.join(', ') : value}</p>`
            ).join('');
        }
        return `<p>${content}</p>`;
    };
    
    addSection('overview', '📋 Overview', plan.overview);
    addSection('objectives', '🎯 Learning Objectives', plan.objectives);
    addSection('materials', '📦 Materials Needed', plan.materials);
    addSection('introduction', '👋 Introduction/Hook', plan.introduction);
    addSection('directInstruction', '📖 Direct Instruction', plan.directInstruction);
    addSection('guidedPractice', '🤝 Guided Practice', plan.guidedPractice);
    addSection('independentPractice', '✍️ Independent Practice', plan.independentPractice);
    addSection('discussion', '💬 Discussion Topics', plan.discussion);
    addSection('funFacts', '🌟 Fun Facts', plan.funFacts);
    addSection('assessment', '📊 Assessment', plan.assessment);
    addSection('closure', '🏁 Closure', plan.closure);
    
    if (options?.includeBlended) {
        addSection('blendedLearning', '🔀 Blended Learning Opportunities', plan.blendedLearning);
    }
    addSection('differentiation', '🎭 Differentiation Strategies', plan.differentiation);
    
    if (options?.includeStandards) {
        addSection('standards', '📜 Standards Alignment', plan.standards);
    }
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${plan.title || 'Lesson Plan'}</title>
    <style>
        * { box-sizing: border-box; font-family: 'Georgia', serif; }
        body { max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #2980b9; margin-top: 30px; border-left: 4px solid #3498db; padding-left: 15px; }
        .section { margin-bottom: 25px; page-break-inside: avoid; }
        .section-content { background: #f8f9fa; padding: 15px; border-radius: 8px; }
        ul { margin: 10px 0; padding-left: 25px; }
        li { margin-bottom: 8px; }
        strong { color: #34495e; }
        .header-info { background: #ecf0f1; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
        .header-info p { margin: 5px 0; }
        @media print {
            body { padding: 20px; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <h1>${plan.title || 'Lesson Plan'}</h1>
    <div class="header-info">
        <p><strong>Generated by:</strong> HoverCam Lesson Planner</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    </div>
    ${sections.join('')}
    <footer style="margin-top: 40px; text-align: center; color: #7f8c8d; font-size: 12px;">
        <p>Generated with HoverCam Desktop - AI-Powered Lesson Planning</p>
    </footer>
</body>
</html>
    `;
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`HoverCam API running on port ${PORT}`);
    console.log(`S3 Bucket: ${BUCKET}`);
});
