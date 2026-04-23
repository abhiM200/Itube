document.addEventListener('DOMContentLoaded', () => {
    let allVideos = [];

    // --- DOM Elements ---
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.getElementById('sidebar');
    const filtersContainer = document.getElementById('filters');
    const videoGrid = document.getElementById('video-grid');
    const subscriptionsList = document.getElementById('subscriptions-list');
    
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    // Auth Elements
    const authModal = document.getElementById('auth-modal');
    const openAuthBtn = document.getElementById('open-auth-btn');
    const closeAuthBtn = document.getElementById('close-auth-btn');
    const toggleAuthMode = document.getElementById('toggle-auth-mode');
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const usernameGroup = document.getElementById('username-group');
    const authUsernameInput = document.getElementById('auth-username');
    const authEmailInput = document.getElementById('auth-email');
    const authPasswordInput = document.getElementById('auth-password');
    const authForm = document.getElementById('auth-form');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const authToggleText = document.getElementById('auth-toggle-text');
    
    const authNavSection = document.getElementById('auth-nav-section');
    const userProfileSection = document.getElementById('user-profile-section');

    let isSignUpMode = false;

    // Modal Elements
    const videoModal = document.getElementById('video-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const actualVideoPlayer = document.getElementById('actual-video-player');
    const modalTitle = document.getElementById('modal-title');
    const modalViews = document.getElementById('modal-views');
    const modalDate = document.getElementById('modal-date');
    const modalChannelAvatar = document.getElementById('modal-channel-avatar');
    const modalChannelName = document.getElementById('modal-channel-name');
    const modalDescription = document.getElementById('modal-description');

    // --- Initialization ---

    async function init() {
        try {
            // 1. Fetch Subscriptions
            const subRes = await fetch('/api/subscriptions');
            const subscriptions = await subRes.json();
            subscriptions.forEach(sub => {
                const subItem = document.createElement('div');
                subItem.className = 'sub-item';
                subItem.innerHTML = `
                    <img src="${sub.img}" alt="${sub.name}">
                    <span>${sub.name}</span>
                `;
                subscriptionsList.appendChild(subItem);
            });

            // 2. Fetch Filters
            const filterRes = await fetch('/api/filters');
            const filters = await filterRes.json();
            filters.forEach((filter, index) => {
                const btn = document.createElement('button');
                btn.className = `filter-chip ${index === 0 ? 'active' : ''}`;
                btn.textContent = filter;
                btn.addEventListener('click', async () => {
                    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                    btn.classList.add('active');
                    const videoRes = await fetch(`/api/videos?category=${filter}`);
                    const filteredVideos = await videoRes.json();
                    renderVideos(filteredVideos);
                });
                filtersContainer.appendChild(btn);
            });

            // 3. Fetch Videos
            const videoRes = await fetch('/api/videos');
            allVideos = await videoRes.json();
            renderVideos(allVideos);

        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    // 3. Render Videos
    function renderVideos(videoArray) {
        videoGrid.innerHTML = '';
        videoArray.forEach(video => {
            const card = document.createElement('div');
            card.className = 'video-card';
            card.innerHTML = `
                <div class="thumbnail-container">
                    <img class="thumbnail" src="${video.thumbnail}" alt="Thumbnail">
                    <span class="duration">${video.duration}</span>
                </div>
                <div class="video-info">
                    <img class="channel-avatar" src="${video.channel.img}" alt="Avatar">
                    <div class="video-details">
                        <h3 class="video-title">${video.title}</h3>
                        <div class="channel-name">
                            ${video.channel.name} 
                            <span class="material-icons-round" style="font-size: 14px;">check_circle</span>
                        </div>
                        <div class="video-stats">
                            ${video.views} views • ${video.date}
                        </div>
                    </div>
                </div>
            `;
            
            // Click to open modal
            card.addEventListener('click', () => openVideoModal(video));
            
            videoGrid.appendChild(card);
        });
    }

    init();

    // --- Event Listeners ---

    // Toggle Sidebar
    menuBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('active');
        } else {
            sidebar.classList.toggle('collapsed');
        }
    });

    // Auth Modal Logic
    openAuthBtn.addEventListener('click', () => {
        authModal.classList.add('active');
    });

    closeAuthBtn.addEventListener('click', () => {
        authModal.classList.remove('active');
    });

    toggleAuthMode.addEventListener('click', (e) => {
        e.preventDefault();
        isSignUpMode = !isSignUpMode;
        
        if (isSignUpMode) {
            authTitle.textContent = 'Create account';
            authSubtitle.textContent = 'to continue to ITube';
            usernameGroup.style.display = 'block';
            authUsernameInput.disabled = false;
            authSubmitBtn.textContent = 'Create';
            authToggleText.innerHTML = 'Already have an account? <a href="#" id="toggle-auth-mode">Sign in</a>';
        } else {
            authTitle.textContent = 'Sign in';
            authSubtitle.textContent = 'to continue to ITube';
            usernameGroup.style.display = 'none';
            authUsernameInput.disabled = true;
            authSubmitBtn.textContent = 'Next';
            authToggleText.innerHTML = 'No account? <a href="#" id="toggle-auth-mode">Create account</a>';
        }
        
        // Re-attach listener since we replaced innerHTML
        document.getElementById('toggle-auth-mode').addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthMode.click();
        });
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const endpoint = isSignUpMode ? '/api/auth/signup' : '/api/auth/signin';
        const payload = {
            email: authEmailInput.value,
            password: authPasswordInput.value
        };
        if (isSignUpMode) payload.username = authUsernameInput.value;

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok) {
                if (isSignUpMode) {
                    alert('Account created! Please sign in.');
                    toggleAuthMode.click();
                } else {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('username', data.username);
                    localStorage.setItem('role', data.role);
                    updateUIForLoggedInUser(data.username);
                    authModal.classList.remove('active');
                }
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Auth error:', error);
        }
    });

    function updateUIForLoggedInUser(username) {
        authNavSection.style.display = 'none';
        userProfileSection.style.display = 'block';
        
        const role = localStorage.getItem('role');
        if (role === 'admin') {
            document.getElementById('admin-panel-link').style.display = 'flex';
        }
    }

    // --- Admin Panel Logic ---
    const adminModal = document.getElementById('admin-modal');
    const openAdminBtn = document.getElementById('admin-panel-link');
    const closeAdminBtn = document.getElementById('close-admin-btn');
    const adminUserList = document.getElementById('admin-user-list');
    
    const adminTotalUsers = document.getElementById('admin-total-users');
    const adminTotalVideos = document.getElementById('admin-total-videos');
    const adminTotalViews = document.getElementById('admin-total-views');

    async function loadAdminDashboard() {
        try {
            const statsRes = await fetch('/api/admin/stats');
            const stats = await statsRes.json();
            adminTotalUsers.textContent = stats.totalUsers;
            adminTotalVideos.textContent = stats.totalVideos;
            adminTotalViews.textContent = stats.totalViews.toLocaleString();

            const usersRes = await fetch('/api/admin/users');
            const users = await usersRes.json();
            adminUserList.innerHTML = '';
            users.forEach(u => {
                const item = document.createElement('div');
                item.className = 'studio-video-item';
                item.innerHTML = `
                    <div class="studio-video-info">
                        <div>
                            <h4>${u.username} (${u.role})</h4>
                            <p>${u.email}</p>
                        </div>
                    </div>
                    <div class="studio-actions">
                        <button class="studio-btn edit-btn">Manage</button>
                        <button class="studio-btn delete-btn">Suspend</button>
                    </div>
                `;
                adminUserList.appendChild(item);
            });
        } catch (err) { console.error(err); }
    }

    openAdminBtn.addEventListener('click', (e) => {
        e.preventDefault();
        adminModal.classList.add('active');
        loadAdminDashboard();
    });

    closeAdminBtn.addEventListener('click', () => adminModal.classList.remove('active'));

    // Check if already logged in
    const savedToken = localStorage.getItem('token');
    const savedUsername = localStorage.getItem('username');
    if (savedToken && savedUsername) {
        updateUIForLoggedInUser(savedUsername);
    }

    // --- Video Upload Logic ---
    const uploadModal = document.getElementById('upload-modal');
    const openUploadBtn = document.querySelector('.create-btn');
    const closeUploadBtn = document.getElementById('close-upload-btn');
    const uploadForm = document.getElementById('upload-form');

    openUploadBtn.addEventListener('click', () => {
        if (!localStorage.getItem('token')) {
            alert('Please sign in to upload videos');
            openAuthBtn.click();
            return;
        }
        uploadModal.classList.add('active');
    });

    closeUploadBtn.addEventListener('click', () => uploadModal.classList.remove('active'));

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', document.getElementById('upload-title').value);
        formData.append('description', document.getElementById('upload-desc').value);
        formData.append('video', document.getElementById('upload-video-file').files[0]);
        formData.append('thumbnail', document.getElementById('upload-thumb-file').files[0]);

        try {
            const res = await fetch('/api/videos/upload', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                alert('Video uploaded successfully!');
                uploadModal.classList.remove('active');
                init(); // Refresh feed
            }
        } catch (err) {
            console.error('Upload error:', err);
        }
    });

    // --- Search Logic ---
    const performSearch = () => {
        const query = searchInput.value.toLowerCase();
        init(query);
    };

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // --- Video Interaction Logic (Likes/Comments) ---
    const likeBtn = document.getElementById('like-btn');
    const likeCount = document.getElementById('like-count');
    const commentInput = document.getElementById('comment-input');
    const submitCommentBtn = document.getElementById('submit-comment');
    const commentsContainer = document.getElementById('comments-container');

    let currentVideoId = null;

    async function openVideoModal(video) {
        currentVideoId = video.id;
        modalTitle.textContent = video.title;
        modalViews.textContent = `${video.views} views`;
        modalDate.textContent = video.date;
        modalChannelAvatar.src = video.channel.img;
        modalChannelName.textContent = video.channel.name;
        modalDescription.textContent = video.description;
        likeCount.textContent = video.likes || 0;

        actualVideoPlayer.src = video.videoUrl;
        renderComments(video.comments);

        videoModal.classList.add('active');
        actualVideoPlayer.play();
    }

    function renderComments(comments) {
        commentsContainer.innerHTML = '';
        if (!comments || comments.length === 0) {
            commentsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 14px;">No comments yet.</p>';
            return;
        }
        comments.forEach(c => {
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.innerHTML = `
                <img src="https://i.pravatar.cc/150?u=${c.user}" class="comment-avatar">
                <div class="comment-content">
                    <h4>@${c.user}</h4>
                    <p>${c.text}</p>
                </div>
            `;
            commentsContainer.appendChild(div);
        });
    }

    likeBtn.addEventListener('click', async () => {
        try {
            const res = await fetch(`/api/videos/${currentVideoId}/like`, { method: 'POST' });
            const data = await res.json();
            likeCount.textContent = data.likes;
            // Update local state
            const video = allVideos.find(v => v.id === currentVideoId);
            if (video) video.likes = data.likes;
        } catch (err) { console.error(err); }
    });

    submitCommentBtn.addEventListener('click', async () => {
        const text = commentInput.value;
        const user = localStorage.getItem('username') || 'Anonymous';
        if (!text) return;

        try {
            const res = await fetch(`/api/videos/${currentVideoId}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, user })
            });
            if (res.ok) {
                const newComment = await res.json();
                const video = allVideos.find(v => v.id === currentVideoId);
                video.comments.push(newComment);
                renderComments(video.comments);
                commentInput.value = '';
            }
        } catch (err) { console.error(err); }
    });

    function closeVideoModal() {
        videoModal.classList.remove('active');
        actualVideoPlayer.pause();
    }

    closeModalBtn.addEventListener('click', closeVideoModal);

    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) closeVideoModal();
    });

    async function init(query = '') {
        try {
            const subRes = await fetch('/api/subscriptions');
            const subscriptions = await subRes.json();
            subscriptionsList.innerHTML = '';
            subscriptions.forEach(sub => {
                const subItem = document.createElement('div');
                subItem.className = 'sub-item';
                subItem.innerHTML = `<img src="${sub.img}" alt="${sub.name}"><span>${sub.name}</span>`;
                subscriptionsList.appendChild(subItem);
            });

            const filterRes = await fetch('/api/filters');
            const filters = await filterRes.json();
            filtersContainer.innerHTML = '';
            filters.forEach((filter, index) => {
                const btn = document.createElement('button');
                btn.className = `filter-chip ${index === 0 && !query ? 'active' : ''}`;
                btn.textContent = filter;
                btn.addEventListener('click', async () => {
                    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                    btn.classList.add('active');
                    init(); // Re-fetch with category if needed, for now just refresh
                });
                filtersContainer.appendChild(btn);
            });

            const videoRes = await fetch(`/api/videos${query ? '?q=' + query : ''}`);
            allVideos = await videoRes.json();
            renderVideos(allVideos);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    // --- Creator Studio Logic ---
    const creatorModal = document.getElementById('creator-modal');
    const openCreatorBtn = document.getElementById('creator-studio-link');
    const closeCreatorBtn = document.getElementById('close-creator-btn');
    const studioVideoList = document.getElementById('studio-video-list');
    const totalViewsEl = document.getElementById('total-views');
    const totalSubsEl = document.getElementById('total-subs');
    const totalLikesEl = document.getElementById('total-likes');

    async function loadCreatorDashboard() {
        try {
            const res = await fetch('/api/creator/stats');
            const data = await res.json();
            
            totalViewsEl.textContent = data.totalViews.toLocaleString();
            totalSubsEl.textContent = data.subscribers;
            totalLikesEl.textContent = data.totalLikes.toLocaleString();

            studioVideoList.innerHTML = '';
            data.videos.forEach(v => {
                const item = document.createElement('div');
                item.className = 'studio-video-item';
                item.innerHTML = `
                    <div class="studio-video-info">
                        <img src="${v.thumbnail}" alt="thumb">
                        <div>
                            <h4>${v.title}</h4>
                            <p>${v.views} views • ${v.likes} likes</p>
                        </div>
                    </div>
                    <div class="studio-actions">
                        <button class="studio-btn edit-btn">Edit</button>
                        <button class="studio-btn delete-btn" onclick="deleteVideo('${v.id}')">Delete</button>
                    </div>
                `;
                studioVideoList.appendChild(item);
            });
        } catch (err) { console.error(err); }
    }

    window.deleteVideo = async (id) => {
        if (!confirm('Are you sure you want to delete this video?')) return;
        try {
            const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert('Video deleted');
                loadCreatorDashboard();
                init();
            }
        } catch (err) { console.error(err); }
    };

    openCreatorBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!localStorage.getItem('token')) {
            alert('Please sign in to access Creator Studio');
            openAuthBtn.click();
            return;
        }
        creatorModal.classList.add('active');
        loadCreatorDashboard();
    });

    closeCreatorBtn.addEventListener('click', () => creatorModal.classList.remove('active'));

    // --- Voice Search Logic ---
    const micBtn = document.querySelector('.mic-btn');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            searchInput.value = transcript;
            performSearch();
        };

        micBtn.addEventListener('click', () => {
            recognition.start();
            micBtn.style.color = 'red';
            setTimeout(() => micBtn.style.color = '', 3000);
        });
    } else {
        micBtn.style.display = 'none';
    }

    init();
});
