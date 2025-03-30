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
    const categoryText = document.createElement('div');
    categoryText.id = 'category-text';
    categoryText.textContent = 'Visar just nu: Alla sånger';
    categoryFilter.parentNode.insertBefore(categoryText, categoryFilter.nextSibling);

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

            // Update category text
            categoryText.textContent = `Visar just nu: ${selectedCategory === 'All' ? 'Alla sånger' : `${selectedCategory} sånger`}`;
        }
    });

    // Set initial active category and text
    const allButton = categoryFilter.querySelector('[data-category="All"]');
    if (allButton) {
        allButton.classList.add('active');
    }
    
}

// Setup search functionality
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

// Fetch GitHub issues
async function fetchGitHubIssues() {
    const issuesList = document.getElementById("github-issues");
    const repoOwner = "Fatalisme";
    const repoName = "Digitala-Sangboken"; 
    const label = "song suggestion"; 

    try {
        const response = await fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}/issues?labels=${encodeURIComponent(label)}`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch issues");
        }

        const issues = await response.json();

        if (issues.length === 0) {
            issuesList.innerHTML = "<li>Inga sångförslag hittades.</li>";
            return;
        }

        issuesList.innerHTML = issues
            .map(
                (issue) => `
                <li>
                    <a href="${issue.html_url}" target="_blank">${issue.title}</a>
                </li>
            `
            )
            .join("");
    } catch (error) {
        issuesList.innerHTML = `<li>Kunde inte ladda issues: ${error.message}</li>`;
    }
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

// Call the function when the page loads
document.addEventListener("DOMContentLoaded", fetchGitHubIssues);
