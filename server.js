const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
