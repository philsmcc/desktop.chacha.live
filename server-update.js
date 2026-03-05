require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { SESClient, SendEmailCommand } = require('@aws-sdk/ses');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Multer for file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const BUCKET = process.env.S3_BUCKET;
const FROM_EMAIL = 'noreply@hovercam.com';
const APP_URL = 'https://desktop.chacha.live';

// In-memory stores (will integrate with PostgreSQL later)
const users = new Map();
const verificationTokens = new Map(); // token -> { username, email, expires }
const pendingUsers = new Map(); // username -> { ...userData, verificationToken }

// Default system wallpapers
const defaultWallpapers = [
    { id: 'default1', name: 'Gradient Dark', url: '/wallpapers/gradient-dark.jpg' },
    { id: 'default2', name: 'Gradient Light', url: '/wallpapers/gradient-light.jpg' },
    { id: 'default3', name: 'Abstract Orange', url: '/wallpapers/abstract-orange.jpg' }
];

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Helper: Get user's S3 prefix
const getUserPrefix = (username) => `users/${username}`;

// Helper: Get default preferences
const getDefaultPreferences = () => ({
    theme: 'light',
    wallpaper: 'gradient-light1',
    wallpaperType: 'gradient',
    wallpaperColor: '#f5f7fa',
    iconPositions: {},
    lastLogin: new Date().toISOString()
});

// Helper: Generate verification token
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Helper: Generate beautiful HTML email template
const generateVerificationEmail = (username, verificationUrl) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your HoverCam Account</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 520px; border-collapse: collapse;">
                    <!-- Logo Header -->
                    <tr>
                        <td align="center" style="padding-bottom: 32px;">
                            <div style="display: inline-flex; align-items: center; gap: 12px;">
                                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #f57c00, #e65100); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                                    <span style="color: white; font-size: 24px; font-weight: bold;">H</span>
                                </div>
                                <span style="font-size: 24px; font-weight: 700; color: #1a1a2e;">HoverCam</span>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Main Card -->
                    <tr>
                        <td style="background: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
                            <!-- Orange Header Bar -->
                            <div style="height: 4px; background: linear-gradient(90deg, #f57c00, #ff9800);"></div>
                            
                            <!-- Content -->
                            <div style="padding: 40px;">
                                <!-- Welcome Message -->
                                <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #1a1a2e; text-align: center;">
                                    Welcome aboard, ${username}! 🎉
                                </h1>
                                <p style="margin: 0 0 32px 0; font-size: 16px; color: #666; text-align: center; line-height: 1.6;">
                                    You're just one click away from accessing your HoverCam Desktop. Please verify your email address to activate your account.
                                </p>
                                
                                <!-- Verify Button -->
                                <div style="text-align: center; margin-bottom: 32px;">
                                    <a href="${verificationUrl}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #f57c00, #e65100); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 16px rgba(245, 124, 0, 0.4);">
                                        Verify Email Address
                                    </a>
                                </div>
                                
                                <!-- Alternative Link -->
                                <p style="margin: 0 0 16px 0; font-size: 14px; color: #888; text-align: center;">
                                    Or copy and paste this link in your browser:
                                </p>
                                <div style="background: #f8f9fa; border-radius: 8px; padding: 12px 16px; word-break: break-all;">
                                    <a href="${verificationUrl}" style="font-size: 13px; color: #f57c00; text-decoration: none;">
                                        ${verificationUrl}
                                    </a>
                                </div>
                                
                                <!-- Expiry Notice -->
                                <p style="margin: 24px 0 0 0; font-size: 13px; color: #999; text-align: center;">
                                    ⏰ This link expires in 24 hours
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
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
</html>
`;
};

// Helper: Send verification email
const sendVerificationEmail = async (email, username, token) => {
    const verificationUrl = `${APP_URL}/api/auth/verify?token=${token}`;
    
    const params = {
        Source: FROM_EMAIL,
        Destination: {
            ToAddresses: [email]
        },
        Message: {
            Subject: {
                Data: 'Verify your HoverCam Desktop account',
                Charset: 'UTF-8'
            },
            Body: {
                Html: {
                    Data: generateVerificationEmail(username, verificationUrl),
                    Charset: 'UTF-8'
                },
                Text: {
                    Data: `Welcome to HoverCam Desktop, ${username}!\n\nPlease verify your email by clicking this link:\n${verificationUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create this account, please ignore this email.`,
                    Charset: 'UTF-8'
                }
            }
        }
    };

    await sesClient.send(new SendEmailCommand(params));
};

// ==================== AUTH ROUTES ====================

// Register - now requires email and sends verification
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;

        // Validation
        if (!username || !password || !email) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        if (username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Please enter a valid email address' });
        }

        // Check if username already exists (in verified users or pending)
        if (users.has(username) || pendingUsers.has(username)) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // Check if email already used
        const emailExists = Array.from(users.values()).some(u => u.email === email) ||
                           Array.from(pendingUsers.values()).some(u => u.email === email);
        if (emailExists) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = generateVerificationToken();
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Store pending user
        pendingUsers.set(username, {
            username,
            email,
            password: hashedPassword,
            verificationToken,
            createdAt: new Date().toISOString()
        });

        // Store verification token mapping
        verificationTokens.set(verificationToken, {
            username,
            email,
            expires
        });

        // Send verification email
        try {
            await sendVerificationEmail(email, username, verificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Clean up
            pendingUsers.delete(username);
            verificationTokens.delete(verificationToken);
            return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
        }

        res.status(201).json({
            message: 'Registration successful! Please check your email to verify your account.',
            requiresVerification: true
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Verify email
app.get('/api/auth/verify', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.redirect(`${APP_URL}?error=invalid_token`);
        }

        const tokenData = verificationTokens.get(token);
        if (!tokenData) {
            return res.redirect(`${APP_URL}?error=invalid_token`);
        }

        if (new Date() > tokenData.expires) {
            // Clean up expired token
            verificationTokens.delete(token);
            pendingUsers.delete(tokenData.username);
            return res.redirect(`${APP_URL}?error=token_expired`);
        }

        const pendingUser = pendingUsers.get(tokenData.username);
        if (!pendingUser) {
            return res.redirect(`${APP_URL}?error=user_not_found`);
        }

        // Move user from pending to verified
        users.set(pendingUser.username, {
            username: pendingUser.username,
            email: pendingUser.email,
            password: pendingUser.password,
            emailVerified: true,
            createdAt: pendingUser.createdAt,
            verifiedAt: new Date().toISOString()
        });

        // Clean up
        pendingUsers.delete(tokenData.username);
        verificationTokens.delete(token);

        // Create default preferences in S3
        try {
            const preferences = getDefaultPreferences();
            await s3Client.send(new PutObjectCommand({
                Bucket: BUCKET,
                Key: `${getUserPrefix(pendingUser.username)}/preferences.json`,
                Body: JSON.stringify(preferences),
                ContentType: 'application/json'
            }));

            // Create user folders
            const folders = ['wallpapers', 'files/Documents', 'files/Pictures', 'files/Videos'];
            for (const folder of folders) {
                await s3Client.send(new PutObjectCommand({
                    Bucket: BUCKET,
                    Key: `${getUserPrefix(pendingUser.username)}/${folder}/.keep`,
                    Body: '',
                    ContentType: 'text/plain'
                }));
            }
        } catch (s3Error) {
            console.error('S3 setup error:', s3Error);
        }

        // Redirect to login with success message
        res.redirect(`${APP_URL}?verified=true`);

    } catch (error) {
        console.error('Verification error:', error);
        res.redirect(`${APP_URL}?error=verification_failed`);
    }
});

// Resend verification email
app.post('/api/auth/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Find pending user with this email
        const pendingUser = Array.from(pendingUsers.values()).find(u => u.email === email);
        if (!pendingUser) {
            return res.status(404).json({ error: 'No pending registration found for this email' });
        }

        // Delete old token
        if (pendingUser.verificationToken) {
            verificationTokens.delete(pendingUser.verificationToken);
        }

        // Generate new token
        const newToken = generateVerificationToken();
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Update pending user
        pendingUser.verificationToken = newToken;
        pendingUsers.set(pendingUser.username, pendingUser);

        // Store new token
        verificationTokens.set(newToken, {
            username: pendingUser.username,
            email: pendingUser.email,
            expires
        });

        // Send new verification email
        await sendVerificationEmail(email, pendingUser.username, newToken);

        res.json({ message: 'Verification email sent!' });

    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Failed to resend verification email' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = users.get(username);
        
        // Check if user exists and is verified
        if (!user) {
            // Check if pending verification
            if (pendingUsers.has(username)) {
                return res.status(403).json({ 
                    error: 'Please verify your email before logging in',
                    requiresVerification: true,
                    email: pendingUsers.get(username).email
                });
            }
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate token
        const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Login successful',
            token,
            user: { 
                username: user.username, 
                email: user.email,
                emailVerified: user.emailVerified 
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
