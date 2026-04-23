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
        // Add logout option or just keep it simple
    }

    // Check if already logged in
    const savedToken = localStorage.getItem('token');
    const savedUsername = localStorage.getItem('username');
    if (savedToken && savedUsername) {
        updateUIForLoggedInUser(savedUsername);
    }

    // Search Logic
    const performSearch = () => {
        const query = searchInput.value.toLowerCase();
        if (query) {
            const filtered = allVideos.filter(v => v.title.toLowerCase().includes(query) || v.channel.name.toLowerCase().includes(query));
            renderVideos(filtered);
        } else {
            renderVideos(allVideos);
        }
    };

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Modal Logic
    function openVideoModal(video) {
        modalTitle.textContent = video.title;
        modalViews.textContent = `${video.views} views`;
        modalDate.textContent = video.date;
        modalChannelAvatar.src = video.channel.img;
        modalChannelName.textContent = video.channel.name;
        modalDescription.textContent = video.description;
        
        videoModal.classList.add('active');
        actualVideoPlayer.play();
    }

    function closeVideoModal() {
        videoModal.classList.remove('active');
        actualVideoPlayer.pause();
    }

    closeModalBtn.addEventListener('click', closeVideoModal);

    // Close modal on outside click
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) {
            closeVideoModal();
        }
    });
});
