const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'itube-super-secret-key';

// Ensure uploads directories exist
const uploadDirs = ['uploads/videos', 'uploads/thumbnails'];
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Multer Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = file.fieldname === 'video' ? 'videos' : 'thumbnails';
        cb(null, `uploads/${type}`);
    },
    filename: (req, file, cb) => {
        cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mock User Database
const users = [];

// Mock Video Database (with likes and comments)
const videos = [
    {
        id: '1',
        title: 'Mastering JavaScript in 2026',
        thumbnail: 'https://picsum.photos/seed/js/400/225',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: '12:45',
        channel: { name: 'CodeCrafters', img: 'https://i.pravatar.cc/150?img=33', subs: '1.2M' },
        views: '450K',
        date: '2 days ago',
        description: 'Learn the latest features of JS!',
        likes: 12000,
        comments: [
            { id: 'c1', user: 'DevGuy', text: 'Amazing tutorial!', replies: [] }
        ],
        tags: ['coding', 'javascript']
    }
];

// Auth API Endpoints (Sign-up, Sign-in)
app.post('/api/auth/signup', async (req, res) => {
    const { username, email, password } = req.body;
    if (users.find(u => u.email === email)) return res.status(400).json({ message: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: uuidv4(), username, email, password: hashedPassword, profilePic: 'https://i.pravatar.cc/150?img=11' };
    users.push(newUser);
    res.status(201).json({ message: 'User created' });
});

app.post('/api/auth/signin', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, username: user.username, profilePic: user.profilePic });
});

// Video API Endpoints
app.get('/api/videos', (req, res) => {
    const { q, category } = req.query;
    let filtered = [...videos];
    if (q) filtered = filtered.filter(v => v.title.toLowerCase().includes(q.toLowerCase()));
    res.json(filtered);
});

app.post('/api/videos/upload', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), (req, res) => {
    const { title, description, category, tags } = req.body;
    const videoFile = req.files['video'][0];
    const thumbnailFile = req.files['thumbnail'][0];

    const newVideo = {
        id: uuidv4(),
        title,
        description,
        category,
        tags: tags ? tags.split(',') : [],
        videoUrl: `/uploads/videos/${videoFile.filename}`,
        thumbnail: `/uploads/thumbnails/${thumbnailFile.filename}`,
        duration: '0:00', // In real app, extract from metadata
        channel: { name: 'Your Channel', img: 'https://i.pravatar.cc/150?img=11', subs: '0' },
        views: '0',
        date: 'Just now',
        likes: 0,
        comments: []
    };
    videos.unshift(newVideo);
    res.status(201).json(newVideo);
});

app.post('/api/videos/:id/like', (req, res) => {
    const video = videos.find(v => v.id === req.params.id);
    if (video) {
        video.likes++;
        return res.json({ likes: video.likes });
    }
    res.status(404).json({ message: 'Video not found' });
});

app.post('/api/videos/:id/comment', (req, res) => {
    const { text, user } = req.body;
    const video = videos.find(v => v.id === req.params.id);
    if (video) {
        const newComment = { id: uuidv4(), user, text, replies: [] };
        video.comments.push(newComment);
        return res.json(newComment);
    }
    res.status(404).json({ message: 'Video not found' });
});

app.get('/api/creator/stats', (req, res) => {
    // In a real app, filter by req.user.id
    const userVideos = videos; // Mocking all for now
    const stats = {
        totalViews: userVideos.reduce((acc, v) => acc + parseInt(v.views.replace('K', '000') || 0), 0),
        totalLikes: userVideos.reduce((acc, v) => acc + (v.likes || 0), 0),
        subscribers: '1.2M', // Mocked
        videos: userVideos
    };
    res.json(stats);
});

app.delete('/api/videos/:id', (req, res) => {
    const index = videos.findIndex(v => v.id === req.params.id);
    if (index !== -1) {
        videos.splice(index, 1);
        return res.json({ message: 'Video deleted' });
    }
    res.status(404).json({ message: 'Video not found' });
});

app.get('/api/filters', (req, res) => res.json(["All", "Gaming", "Music", "Live", "Mixes", "News", "Computers", "Podcasts"]));
app.get('/api/subscriptions', (req, res) => res.json([
    { name: "TechCrafter", img: "https://i.pravatar.cc/150?img=33" },
    { name: "CodeNinja", img: "https://i.pravatar.cc/150?img=12" }
]));

// Serve frontend for all other routes
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
