const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'itube-super-secret-key'; // In production, use an environment variable

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mock User Database
const users = [];

// Auth API Endpoints
app.post('/api/auth/signup', async (req, res) => {
    const { username, email, password } = req.body;
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), username, email, password: hashedPassword };
    users.push(newUser);
    res.status(201).json({ message: 'User created' });
});

app.post('/api/auth/signin', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, username: user.username });
});

// Mock Data
const filters = ["All", "Gaming", "Music", "Live", "Mixes", "News", "Computers", "Podcasts", "Recently uploaded", "Watched", "New to you"];

const subscriptions = [
    { name: "TechCrafter", img: "https://i.pravatar.cc/150?img=33" },
    { name: "CodeNinja", img: "https://i.pravatar.cc/150?img=12" },
    { name: "DesignPro", img: "https://i.pravatar.cc/150?img=5" },
    { name: "DailyVlogs", img: "https://i.pravatar.cc/150?img=8" },
    { name: "GameStream", img: "https://i.pravatar.cc/150?img=59" }
];

const generateMockVideos = () => {
    const videos = [];
    for (let i = 1; i <= 24; i++) {
        videos.push({
            id: i,
            title: `Awesome Video Title ${i} - You won't believe what happens next!`,
            thumbnail: `https://picsum.photos/seed/${i}/400/225`,
            duration: `${Math.floor(Math.random() * 20) + 1}:${Math.floor(Math.random() * 50) + 10}`,
            channel: subscriptions[i % subscriptions.length],
            views: `${Math.floor(Math.random() * 900) + 10}K`,
            date: `${Math.floor(Math.random() * 11) + 1} months ago`,
            description: `This is a highly detailed description for video ${i}. It covers all the amazing content you'll see in the video. Don't forget to like, subscribe, and hit the notification bell!`
        });
    }
    return videos;
};

const videos = generateMockVideos();

// API Endpoints
app.get('/api/videos', (req, res) => {
    const { category } = req.query;
    if (category && category !== 'All') {
        // Simple logic to simulate filtering (shuffling for mock effect)
        return res.json([...videos].sort(() => 0.5 - Math.random()));
    }
    res.json(videos);
});

app.get('/api/filters', (req, res) => {
    res.json(filters);
});

app.get('/api/subscriptions', (req, res) => {
    res.json(subscriptions);
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
