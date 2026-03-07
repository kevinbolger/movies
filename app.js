document.addEventListener('DOMContentLoaded', async () => {
    let allMovies = [];
    let filteredMovies = [];
    let currentlyDisplayed = 0;
    const LOAD_CHUNK = 100; // How many to render at once

    // DOM Elements
    const movieGrid = document.getElementById('movieGrid');
    const searchInput = document.getElementById('searchInput');
    const categorySelect = document.getElementById('categorySelect');
    const yearSelect = document.getElementById('yearSelect');
    const sortSelect = document.getElementById('sortSelect');
    const currentCategoryText = document.getElementById('currentCategoryText');
    const statsContainer = document.getElementById('statsContainer');
    const loading = document.getElementById('loading');

    // Fetch Data
    try {
        if (typeof ALL_MOVIES === 'undefined') {
            throw new Error('ALL_MOVIES data payload not found. Ensure data.js is loaded.');
        }
        allMovies = ALL_MOVIES;
        filteredMovies = [...allMovies];

        // Populate years dynamically
        const years = [...new Set(allMovies.map(m => m.Year).filter(Boolean))].sort((a, b) => b - a);
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });

        loading.style.display = 'none';
        applyFilters();
    } catch (error) {
        console.error("Error loading data:", error);
        loading.textContent = "Failed to load database. Please ensure data.js exists and is linked.";
    }

    // Event Listeners for filters
    const debouncedFilter = debounce(applyFilters, 300);
    searchInput.addEventListener('input', debouncedFilter);
    categorySelect.addEventListener('change', applyFilters);
    yearSelect.addEventListener('change', applyFilters);
    sortSelect.addEventListener('change', applyFilters);

    function debounce(func, timeout = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => { func.apply(this, args); }, timeout);
        };
    }

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const category = categorySelect.value;
        const yearOpt = yearSelect.value;
        const sort = sortSelect.value;

        filteredMovies = allMovies.filter(movie => {
            const title = String(movie.Title || '').toLowerCase();
            const director = String(movie.Director || '').toLowerCase();

            const matchesSearch = title.includes(searchTerm) || director.includes(searchTerm);
            const matchesCategory = category === 'all' || movie.Category === category;

            let matchesYear = true;
            if (yearOpt !== 'all') {
                matchesYear = String(movie.Year) === yearOpt;
            }

            return matchesSearch && matchesCategory && matchesYear;
        });

        // Apply Sorting
        filteredMovies.sort((a, b) => {
            const yearA = parseInt(a.Year, 10);
            const yearB = parseInt(b.Year, 10);
            const rankA = parseInt(a.Rank, 10);
            const rankB = parseInt(b.Rank, 10);

            if (sort === 'year-desc') return yearB - yearA || rankA - rankB;
            if (sort === 'year-asc') return yearA - yearB || rankA - rankB;
            if (sort === 'rank-asc') return rankA - rankB || yearB - yearA;
            if (sort === 'rank-desc') return rankB - rankA || yearB - yearA;
            return 0;
        });

        // Update UI Context
        currentCategoryText.textContent = categorySelect.options[categorySelect.selectedIndex].text;
        updateStats();

        // Reset grid
        movieGrid.innerHTML = '';
        currentlyDisplayed = 0;

        if (filteredMovies.length === 0) {
            movieGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 4rem; color: var(--text-secondary); font-size: 1.2rem;">No movies found matching criteria. Explore something else!</div>';
            return;
        }

        renderMovies();
    }

    function getGenreClass(genre) {
        if (!genre) return '';
        const g = genre.toLowerCase();
        if (g.includes('action')) return 'genre-action';
        if (g.includes('sci-fi')) return 'genre-scifi';
        if (g.includes('drama')) return 'genre-drama';
        if (g.includes('horror')) return 'genre-horror';
        if (g.includes('comedy')) return 'genre-comedy';
        return '';
    }

    function renderMovies() {
        // Remove existing load more button if present
        const currentBtn = document.querySelector('.load-more-btn');
        if (currentBtn) currentBtn.remove();

        const limit = Math.min(filteredMovies.length, currentlyDisplayed + LOAD_CHUNK);

        const fragment = document.createDocumentFragment();

        for (let i = currentlyDisplayed; i < limit; i++) {
            const movie = filteredMovies[i];
            const card = document.createElement('div');

            // Map the MacroGenre and Decade for the background image
            const rawGenre = movie.MacroGenre || 'Drama';
            const cleanGenre = rawGenre.toLowerCase();

            let bgImage = '';
            if (movie.Year) {
                let decade = Math.floor(parseInt(movie.Year, 10) / 10) * 10;
                if (decade < 1920) decade = 1920;
                if (decade > 2020) decade = 2020;
                bgImage = `style="background-image: linear-gradient(to top, rgba(10, 10, 15, 0.95) 0%, rgba(10, 10, 15, 0.75) 100%), url('assets/${cleanGenre}/${decade}/bg.png'); background-size: cover; background-position: center;"`;
            }

            card.className = `movie-card genre-${cleanGenre}`;

            const genreLabel = movie.Genre || 'Unknown Genre';

            card.innerHTML = `
                <div class="card-bg" ${bgImage}></div>
                <div class="category-indicator"></div>
                <div class="card-header">
                    <div class="rank-badge">#${movie.Rank || '-'}</div>
                    <div class="year-badge">${movie.Year || 'N/A'}</div>
                </div>
                <div class="category-tag">${genreLabel}</div>
                <h3 class="movie-title">${movie.Title || 'Unknown Title'}</h3>
                <p class="movie-director">Directed by ${movie.Director || 'Unknown'}</p>
                <div class="movie-note">
                    <span class="movie-note-type">${movie.Category ? movie.Category.replace('Top 10 ', '') : 'Details'}</span>
                    <div class="movie-stats">
                        ${getStatsHtml(movie)}
                    </div>
                </div>
            `;
            fragment.appendChild(card);
        }

        movieGrid.appendChild(fragment);
        currentlyDisplayed = limit;

        if (currentlyDisplayed < filteredMovies.length) {
            const loadBtn = document.createElement('button');
            loadBtn.className = 'load-more-btn';
            loadBtn.textContent = `Load More (${filteredMovies.length - currentlyDisplayed} remaining)`;
            loadBtn.onclick = () => renderMovies();
            movieGrid.appendChild(loadBtn);
        }
    }

    function updateStats() {
        const uniqueDirectors = new Set(filteredMovies.map(m => m.Director).filter(Boolean)).size;

        statsContainer.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Total Results</span>
                <span class="stat-value">${filteredMovies.length} movies</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Unique Directors</span>
                <span class="stat-value">${uniqueDirectors}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Data Coverage</span>
                <span class="stat-value">${Math.round((filteredMovies.length / allMovies.length) * 100) || 0}%</span>
            </div>
        `;
    }

    function getStatsHtml(movie) {
        let statsHtml = '';
        if (movie.Category === "Top 10 Box Office") {
            statsHtml += `<div><strong>Budget:</strong> ${movie.Budget || 'N/A'}</div>`;
            statsHtml += `<div><strong>Domestic Gross:</strong> ${movie.DomesticGross || 'N/A'}</div>`;
            if (movie.WorldwideGross) statsHtml += `<div><strong>Worldwide:</strong> ${movie.WorldwideGross}</div>`;
        } else if (movie.Category === "Top 10 Critically Acclaimed") {
            statsHtml += `<div><strong>RT Score:</strong> ${movie.RTScore || 'N/A'}</div>`;
            statsHtml += `<div><strong>Metacritic:</strong> ${movie.Metacritic || 'N/A'}</div>`;
            statsHtml += `<div><strong>Note:</strong> ${movie.KeyRecognition || 'N/A'}</div>`;
        } else if (movie.Category === "Top 10 Award Winning") {
            statsHtml += `<div><strong>Oscar Wins:</strong> ${movie.OscarWins || '0'}</div>`;
            statsHtml += `<div><strong>Oscar Noms:</strong> ${movie.OscarNoms || '0'}</div>`;
            if (movie.OtherAwards) statsHtml += `<div><strong>Other:</strong> ${movie.OtherAwards}</div>`;
        } else if (movie.Category === "Top 10 Cult Classics") {
            statsHtml += `<div><strong>Current RT:</strong> ${movie.CurrentRTScore || 'N/A'}</div>`;
            statsHtml += `<div><strong>Box Office:</strong> ${movie.OriginalBoxOffice || 'N/A'}</div>`;
            statsHtml += `<div><strong>Note:</strong> ${movie.CultStatusReason || 'N/A'}</div>`;
        } else {
            // Fallback for custom or unified rows later
            statsHtml += `<div><strong>Studio:</strong> ${movie.Studio || 'N/A'}</div>`;
        }
        return statsHtml;
    }
});
