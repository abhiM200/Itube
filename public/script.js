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
