require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
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

const BUCKET = process.env.S3_BUCKET;

// In-memory user store (will integrate with PostgreSQL later)
const users = new Map();

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
    theme: 'dark',
    wallpaper: null,
    wallpaperType: 'default', // 'default', 'custom', 'color'
    wallpaperColor: '#0f0f1a',
    iconPositions: {},
    lastLogin: new Date().toISOString()
});

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        if (users.has(username)) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        users.set(username, {
            username,
            email: email || '',
            password: hashedPassword,
            createdAt: new Date().toISOString()
        });

        // Create default preferences in S3
        const preferences = getDefaultPreferences();
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: `${getUserPrefix(username)}/preferences.json`,
            Body: JSON.stringify(preferences),
            ContentType: 'application/json'
        }));

        // Create user folders
        const folders = ['wallpapers', 'files/Documents', 'files/Pictures', 'files/Videos'];
        for (const folder of folders) {
            await s3Client.send(new PutObjectCommand({
                Bucket: BUCKET,
                Key: `${getUserPrefix(username)}/${folder}/.keep`,
                Body: '',
                ContentType: 'text/plain'
            }));
        }

        const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { username, email: email || '' }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
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
        
        // For demo: auto-create user if doesn't exist
        if (!user) {
            const hashedPassword = await bcrypt.hash(password, 10);
            users.set(username, {
                username,
                email: '',
                password: hashedPassword,
                createdAt: new Date().toISOString()
            });

            // Create default preferences in S3
            const preferences = getDefaultPreferences();
            try {
                await s3Client.send(new PutObjectCommand({
                    Bucket: BUCKET,
                    Key: `${getUserPrefix(username)}/preferences.json`,
                    Body: JSON.stringify(preferences),
                    ContentType: 'application/json'
                }));
            } catch (s3Error) {
                console.log('S3 preference creation skipped:', s3Error.message);
            }

            const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '7d' });
            return res.json({
                message: 'Login successful',
                token,
                user: { username, email: '' }
            });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Update last login in preferences
        try {
            const prefKey = `${getUserPrefix(username)}/preferences.json`;
            let preferences = getDefaultPreferences();
            
            try {
                const response = await s3Client.send(new GetObjectCommand({
                    Bucket: BUCKET,
                    Key: prefKey
                }));
                const body = await response.Body.transformToString();
                preferences = JSON.parse(body);
            } catch (e) {
                // Use default preferences if not found
            }

            preferences.lastLogin = new Date().toISOString();
            await s3Client.send(new PutObjectCommand({
                Bucket: BUCKET,
                Key: prefKey,
                Body: JSON.stringify(preferences),
                ContentType: 'application/json'
            }));
        } catch (s3Error) {
            console.log('Preferences update skipped:', s3Error.message);
        }

        res.json({
            message: 'Login successful',
            token,
            user: { username, email: user.email }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ==================== PREFERENCES ROUTES ====================

// Get user preferences
app.get('/api/preferences', authenticateToken, async (req, res) => {
    try {
        const { username } = req.user;
        const key = `${getUserPrefix(username)}/preferences.json`;

        try {
            const response = await s3Client.send(new GetObjectCommand({
                Bucket: BUCKET,
                Key: key
            }));
            const body = await response.Body.transformToString();
            res.json(JSON.parse(body));
        } catch (error) {
            if (error.name === 'NoSuchKey') {
                const defaults = getDefaultPreferences();
                res.json(defaults);
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({ error: 'Failed to get preferences' });
    }
});

// Update user preferences
app.put('/api/preferences', authenticateToken, async (req, res) => {
    try {
        const { username } = req.user;
        const updates = req.body;
        const key = `${getUserPrefix(username)}/preferences.json`;

        // Get existing preferences
        let preferences = getDefaultPreferences();
        try {
            const response = await s3Client.send(new GetObjectCommand({
                Bucket: BUCKET,
                Key: key
            }));
            const body = await response.Body.transformToString();
            preferences = JSON.parse(body);
        } catch (e) {
            // Use defaults if not found
        }

        // Merge updates
        preferences = { ...preferences, ...updates };

        // Save to S3
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: JSON.stringify(preferences),
            ContentType: 'application/json'
        }));

        res.json({ message: 'Preferences updated', preferences });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

// ==================== WALLPAPER ROUTES ====================

// Get system wallpapers
app.get('/api/wallpapers/system', async (req, res) => {
    try {
        const wallpapers = [];
        
        // List wallpapers from S3 system folder
        try {
            const response = await s3Client.send(new ListObjectsV2Command({
                Bucket: BUCKET,
                Prefix: 'system/wallpapers/'
            }));

            if (response.Contents) {
                for (const item of response.Contents) {
                    if (item.Key.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                        const url = await getSignedUrl(s3Client, new GetObjectCommand({
                            Bucket: BUCKET,
                            Key: item.Key
                        }), { expiresIn: 3600 });

                        wallpapers.push({
                            id: item.Key,
                            name: item.Key.split('/').pop().replace(/\.[^/.]+$/, ''),
                            url,
                            type: 'system'
                        });
                    }
                }
            }
        } catch (e) {
            console.log('S3 system wallpapers not found:', e.message);
        }

        // Add default wallpapers if none in S3
        if (wallpapers.length === 0) {
            wallpapers.push(...defaultWallpapers);
        }

        res.json(wallpapers);
    } catch (error) {
        console.error('Get system wallpapers error:', error);
        res.status(500).json({ error: 'Failed to get system wallpapers' });
    }
});

// Get user wallpapers
app.get('/api/wallpapers/user', authenticateToken, async (req, res) => {
    try {
        const { username } = req.user;
        const prefix = `${getUserPrefix(username)}/wallpapers/`;
        const wallpapers = [];

        try {
            const response = await s3Client.send(new ListObjectsV2Command({
                Bucket: BUCKET,
                Prefix: prefix
            }));

            if (response.Contents) {
                for (const item of response.Contents) {
                    if (item.Key.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                        const url = await getSignedUrl(s3Client, new GetObjectCommand({
                            Bucket: BUCKET,
                            Key: item.Key
                        }), { expiresIn: 3600 });

                        wallpapers.push({
                            id: item.Key,
                            name: item.Key.split('/').pop().replace(/\.[^/.]+$/, ''),
                            url,
                            type: 'user'
                        });
                    }
                }
            }
        } catch (e) {
            console.log('No user wallpapers found');
        }

        res.json(wallpapers);
    } catch (error) {
        console.error('Get user wallpapers error:', error);
        res.status(500).json({ error: 'Failed to get user wallpapers' });
    }
});

// Upload wallpaper
app.post('/api/wallpapers/upload', authenticateToken, upload.single('wallpaper'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { username } = req.user;
        const filename = `${Date.now()}-${req.file.originalname}`;
        const key = `${getUserPrefix(username)}/wallpapers/${filename}`;

        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        }));

        const url = await getSignedUrl(s3Client, new GetObjectCommand({
            Bucket: BUCKET,
            Key: key
        }), { expiresIn: 3600 });

        res.json({
            message: 'Wallpaper uploaded successfully',
            wallpaper: {
                id: key,
                name: filename,
                url,
                type: 'user'
            }
        });
    } catch (error) {
        console.error('Upload wallpaper error:', error);
        res.status(500).json({ error: 'Failed to upload wallpaper' });
    }
});

// Delete wallpaper - using POST with body for the ID
app.post('/api/wallpapers/delete', authenticateToken, async (req, res) => {
    try {
        const { username } = req.user;
        const wallpaperId = req.body.wallpaperId;

        // Ensure user can only delete their own wallpapers
        if (!wallpaperId.startsWith(`users/${username}/wallpapers/`)) {
            return res.status(403).json({ error: 'Cannot delete this wallpaper' });
        }

        await s3Client.send(new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: wallpaperId
        }));

        res.json({ message: 'Wallpaper deleted successfully' });
    } catch (error) {
        console.error('Delete wallpaper error:', error);
        res.status(500).json({ error: 'Failed to delete wallpaper' });
    }
});

// Get signed URL for wallpaper - using query param
app.get('/api/wallpapers/url', authenticateToken, async (req, res) => {
    try {
        const wallpaperId = req.query.id;
        
        const url = await getSignedUrl(s3Client, new GetObjectCommand({
            Bucket: BUCKET,
            Key: wallpaperId
        }), { expiresIn: 3600 });

        res.json({ url });
    } catch (error) {
        console.error('Get wallpaper URL error:', error);
        res.status(500).json({ error: 'Failed to get wallpaper URL' });
    }
});

// ==================== FILE STORAGE ROUTES ====================

// List files in a folder - using query param
app.get('/api/files', authenticateToken, async (req, res) => {
    try {
        const { username } = req.user;
        const folder = req.query.folder || '';
        const prefix = `${getUserPrefix(username)}/files/${folder}`;

        const response = await s3Client.send(new ListObjectsV2Command({
            Bucket: BUCKET,
            Prefix: prefix.endsWith('/') ? prefix : `${prefix}/`,
            Delimiter: '/'
        }));

        const files = [];
        const folders = [];

        // Get folders (CommonPrefixes)
        if (response.CommonPrefixes) {
            for (const prefix of response.CommonPrefixes) {
                const name = prefix.Prefix.split('/').filter(Boolean).pop();
                folders.push({
                    name,
                    type: 'folder',
                    path: prefix.Prefix
                });
            }
        }

        // Get files
        if (response.Contents) {
            for (const item of response.Contents) {
                if (!item.Key.endsWith('.keep') && !item.Key.endsWith('/')) {
                    files.push({
                        name: item.Key.split('/').pop(),
                        type: 'file',
                        size: item.Size,
                        lastModified: item.LastModified,
                        path: item.Key
                    });
                }
            }
        }

        res.json({ folders, files });
    } catch (error) {
        console.error('List files error:', error);
        res.status(500).json({ error: 'Failed to list files' });
    }
});

// Upload file - using query param for folder
app.post('/api/files/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { username } = req.user;
        const folder = req.query.folder || '';
        const filename = req.file.originalname;
        const key = `${getUserPrefix(username)}/files/${folder}/${filename}`.replace(/\/+/g, '/');

        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        }));

        res.json({
            message: 'File uploaded successfully',
            file: {
                name: filename,
                path: key,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error('Upload file error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Create folder
app.post('/api/files/folder', authenticateToken, async (req, res) => {
    try {
        const { username } = req.user;
        const { path: folderPath } = req.body;
        
        if (!folderPath) {
            return res.status(400).json({ error: 'Folder path is required' });
        }
        
        // Normalize path and create the folder marker
        const normalizedPath = folderPath.replace(/^\/+|\/+$/g, '');
        const key = `${getUserPrefix(username)}/files/${normalizedPath}/.keep`;
        
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: '',
            ContentType: 'application/x-directory'
        }));
        
        res.json({
            message: 'Folder created successfully',
            folder: {
                name: normalizedPath.split('/').pop(),
                path: normalizedPath
            }
        });
    } catch (error) {
        console.error('Create folder error:', error);
        res.status(500).json({ error: 'Failed to create folder' });
    }
});

// Delete file or folder
app.delete('/api/files', authenticateToken, async (req, res) => {
    try {
        const { username } = req.user;
        const { path: itemPath, type } = req.body;
        
        if (!itemPath) {
            return res.status(400).json({ error: 'Path is required' });
        }
        
        const userPrefix = getUserPrefix(username);
        
        if (type === 'folder') {
            // Delete all objects in the folder
            const prefix = `${userPrefix}/files/${itemPath}/`.replace(/\/+/g, '/');
            
            const listResponse = await s3Client.send(new ListObjectsV2Command({
                Bucket: BUCKET,
                Prefix: prefix
            }));
            
            if (listResponse.Contents && listResponse.Contents.length > 0) {
                for (const item of listResponse.Contents) {
                    await s3Client.send(new DeleteObjectCommand({
                        Bucket: BUCKET,
                        Key: item.Key
                    }));
                }
            }
        } else {
            // Delete single file
            const key = `${userPrefix}/files/${itemPath}`.replace(/\/+/g, '/');
            await s3Client.send(new DeleteObjectCommand({
                Bucket: BUCKET,
                Key: key
            }));
        }
        
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete' });
    }
});

// Get signed URL for file access
app.get('/api/files/url', authenticateToken, async (req, res) => {
    try {
        const { path: filePath } = req.query;
        
        if (!filePath) {
            return res.status(400).json({ error: 'File path is required' });
        }
        
        const command = new GetObjectCommand({
            Bucket: BUCKET,
            Key: filePath
        });
        
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        res.json({ url: signedUrl });
    } catch (error) {
        console.error('Get URL error:', error);
        res.status(500).json({ error: 'Failed to get file URL' });
    }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`HoverCam API server running on port ${PORT}`);
    console.log(`S3 Bucket: ${BUCKET}`);
});
