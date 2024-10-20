let allSongs = [];
let categories = [];
let isTagSearchEnabled = false;

// Fetch songs from JSON file
async function fetchSongs() {
    const response = await fetch('data/lesongs.json');
    allSongs = await response.json();
    categories = ['All', ...new Set(allSongs.map(song => song.category))];
    return allSongs;
}

// Display songs in the DOM
function displaySongs(songs) {
    const songList = document.getElementById('song-list');
    songList.innerHTML = songs.map(song => `
        <div class="song">
            <h2>${song.title}</h2>
            <h3 class="song-melody">${song.melody}</h3>
            <h4 class="song-author">${song.author}</h4>
            <p class="song_cat">Category: ${song.category}</p>
            <pre>${song.lyrics}</pre>
            <p class="song_coolinfodude">${song.info}</p>
            ${song.tags && (typeof song.tags === 'string' ? song.tags.length > 0 : song.tags.length > 0) 
                ? `<p class="song_tag">tag: ${Array.isArray(song.tags) ? song.tags.join(', ') : song.tags}</p>` 
                : ''}            
        </div>
    `).join('');
}

// Filter songs based on search input and category
function filterSongs(searchTerm, category) {
    return allSongs.filter(song => 
        (category === 'All' || song.category === category) &&
        (song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.lyrics.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (isTagSearchEnabled && song.tags && song.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );
}

// Setup category filter buttons
function setupCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    categoryFilter.innerHTML = categories.map(category => `
        <button class="category-btn" data-category="${category}">${category}</button>
    `).join('');

    categoryFilter.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            const selectedCategory = e.target.dataset.category;
            const searchTerm = document.getElementById('search-input').value;
            const filteredSongs = filterSongs(searchTerm, selectedCategory);
            displaySongs(filteredSongs);

            // Update active button
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');
        }
    });
}

// Setup search functionality
/* function setupSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value;
        const activeCategory = document.querySelector('.category-btn.active').dataset.category;
        const filteredSongs = filterSongs(searchTerm, activeCategory);
        displaySongs(filteredSongs);
    });
} */

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const tagSearchCheckbox = document.getElementById('tag-search-checkbox');

    searchInput.addEventListener('input', performSearch);
    tagSearchCheckbox.addEventListener('change', (e) => {
        isTagSearchEnabled = e.target.checked;
        performSearch();
    });
}

function performSearch() {
    const searchTerm = document.getElementById('search-input').value;
    const activeCategory = document.querySelector('.category-btn.active').dataset.category;
    const filteredSongs = filterSongs(searchTerm, activeCategory);
    displaySongs(filteredSongs);
}

// Initialize the application
async function init() {
    await fetchSongs();
    displaySongs(allSongs);
    setupCategoryFilter();
    setupSearch();
    // Set 'All' category as active by default and display all songs
    const allButton = document.querySelector('.category-btn[data-category="All"]');
    allButton.classList.add('active');
    allButton.click(); // Simulate a click on the 'All' button
}

init();
