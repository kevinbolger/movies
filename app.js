document.addEventListener('DOMContentLoaded', async () => {
    let allMovies = [];
    // Vanilla JS Multi-Select Component
    class MultiSelect {
        constructor(idPrefix, allOptions) {
            this.input = document.getElementById(`${idPrefix}Input`);
            this.container = document.getElementById(`${idPrefix}MultiSelect`);
            this.pillsContainer = document.getElementById(`${idPrefix}Pills`);
            this.dropdown = document.getElementById(`${idPrefix}Dropdown`);

            this.allOptions = allOptions;
            this.selectedOptions = [];

            this.initListeners();
        }

        initListeners() {
            // Fuzzy search on input
            this.input.addEventListener('input', () => {
                this.renderDropdown();
                applyFilters(); // Trigger fuzzy master filter
            });

            // Show dropdown on focus
            this.input.addEventListener('focus', () => {
                this.container.querySelector('.ms-search-box').classList.add('focused');
                this.renderDropdown();
            });

            // Hide on blur (with delay for clicks)
            this.input.addEventListener('blur', () => {
                this.container.querySelector('.ms-search-box').classList.remove('focused');
                setTimeout(() => this.dropdown.classList.remove('active'), 200);
            });
        }

        renderDropdown() {
            const query = this.input.value.toLowerCase().trim();
            this.dropdown.innerHTML = '';

            // Filter options based on fuzzy text, excluding already selected ones
            const visibleOptions = this.allOptions.filter(opt =>
                opt.toLowerCase().includes(query) && !this.selectedOptions.includes(opt)
            );

            if (visibleOptions.length === 0) {
                this.dropdown.classList.remove('active');
                return;
            }

            visibleOptions.forEach(opt => {
                const el = document.createElement('div');
                el.className = 'ms-option';
                el.textContent = opt;
                el.onclick = () => this.selectOption(opt);
                this.dropdown.appendChild(el);
            });

            this.dropdown.classList.add('active');
        }

        selectOption(opt) {
            if (!this.selectedOptions.includes(opt)) {
                this.selectedOptions.push(opt);
                this.renderPills();

                // Clear input text now that we have an exact pill
                this.input.value = '';
                this.dropdown.classList.remove('active');
                applyFilters();
            }
        }

        removeOption(opt) {
            this.selectedOptions = this.selectedOptions.filter(o => o !== opt);
            this.renderPills();
            applyFilters();
        }

        renderPills() {
            this.pillsContainer.innerHTML = '';
            this.selectedOptions.forEach(opt => {
                const pill = document.createElement('div');
                pill.className = 'ms-pill';
                pill.innerHTML = `
                    <span>${opt}</span>
                    <span class="ms-pill-close">×</span>
                `;
                pill.querySelector('.ms-pill-close').onclick = () => this.removeOption(opt);
                this.pillsContainer.appendChild(pill);
            });
        }
    }
    let filteredMovies = [];
    let currentlyDisplayed = 0;
    const LOAD_CHUNK = 100; // How many to render at once

    // DOM Elements
    const movieGrid = document.getElementById('movieGrid');
    const titleInput = document.getElementById('titleInput');
    const directorInput = document.getElementById('directorInput');
    const categoryInput = document.getElementById('categoryInput');
    const genreInput = document.getElementById('genreInput');
    const genreList = document.getElementById('genreList');
    const yearMinInput = document.getElementById('yearMinInput');
    const yearMaxInput = document.getElementById('yearMaxInput');
    const yearList = document.getElementById('yearList');
    const rankMinInput = document.getElementById('rankMinInput');
    const rankMaxInput = document.getElementById('rankMaxInput');
    const minCatInput = document.getElementById('minCatInput');
    const sortSelect = document.getElementById('sortSelect');
    const currentCategoryText = document.getElementById('currentCategoryText');
    const statsContainer = document.getElementById('statsContainer');
    const loading = document.getElementById('loading');

    // Multi-select Instances
    let categoryMS, genreMS;

    // Modal & Lucky Button
    const luckyBtn = document.getElementById('luckyBtn');
    const movieModal = document.getElementById('movieModal');
    const modalClose = document.getElementById('modalClose');
    const modalCardContainer = document.getElementById('modalCardContainer');

    // Fetch Data
    try {
        if (typeof ALL_MOVIES === 'undefined') {
            throw new Error('ALL_MOVIES data payload not found. Ensure data.js is loaded.');
        }
        allMovies = ALL_MOVIES;
        filteredMovies = [...allMovies];

        // Populate categories dynamically
        const uniqueCategories = [...new Set(allMovies.map(m => m.Category).filter(Boolean))].sort();
        categoryMS = new MultiSelect('category', uniqueCategories);

        // Populate genres dynamically
        const uniqueGenres = new Set();
        allMovies.forEach(m => {
            if (m.Genre) {
                const clean = m.Genre.trim();
                if (clean) uniqueGenres.add(clean);
            }
        });
        const sortedGenres = [...uniqueGenres].sort();
        genreMS = new MultiSelect('genre', sortedGenres);

        // Populate years dynamically
        const years = [...new Set(allMovies.map(m => m.Year).filter(Boolean))].sort((a, b) => b - a);
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            yearList.appendChild(option);
        });

        loading.style.display = 'none';
        applyFilters();
    } catch (error) {
        console.error("Error loading data:", error);
        loading.textContent = "Failed to load database. Please ensure data.js exists and is linked.";
    }

    // Modal Listeners
    if (luckyBtn) luckyBtn.addEventListener('click', showLuckyMovie);
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            movieModal.classList.remove('active');
            setTimeout(() => modalCardContainer.innerHTML = '', 400);
        });
    }
    if (movieModal) {
        movieModal.addEventListener('click', (e) => {
            if (e.target === movieModal) {
                movieModal.classList.remove('active');
                setTimeout(() => modalCardContainer.innerHTML = '', 400);
            }
        });
    }

    function showLuckyMovie() {
        if (filteredMovies.length === 0) return;
        const randomIdx = Math.floor(Math.random() * filteredMovies.length);
        const movie = filteredMovies[randomIdx];

        modalCardContainer.innerHTML = '';
        modalCardContainer.appendChild(createMovieCardElement(movie));
        movieModal.classList.add('active');
    }

    // Multi-Selects manage their own input listeners, but bind title/range inputs here
    const debouncedFilter = debounce(applyFilters, 300);
    titleInput.addEventListener('input', debouncedFilter);
    directorInput.addEventListener('input', debouncedFilter);
    yearMinInput.addEventListener('input', applyFilters);
    yearMaxInput.addEventListener('input', debouncedFilter);
    rankMinInput.addEventListener('input', debouncedFilter);
    rankMaxInput.addEventListener('input', debouncedFilter);
    minCatInput.addEventListener('input', debouncedFilter);
    sortSelect.addEventListener('change', debouncedFilter);

    function debounce(func, timeout = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => { func.apply(this, args); }, timeout);
        };
    }

    function applyFilters() {
        const titleQuery = titleInput.value.toLowerCase().trim();
        const directorQuery = directorInput.value.toLowerCase().trim();

        // Exact match pills
        const selectedCategories = categoryMS ? categoryMS.selectedOptions : [];
        const selectedGenres = genreMS ? genreMS.selectedOptions : [];

        // Fuzzy text search
        const fuzzyCategory = categoryInput.value.toLowerCase().trim();
        const fuzzyGenre = genreInput.value.toLowerCase().trim();

        const minYearVal = parseInt(yearMinInput.value, 10);
        const maxYearVal = parseInt(yearMaxInput.value, 10);

        const sort = sortSelect.value;

        filteredMovies = allMovies.filter(movie => {
            const title = String(movie.Title || '').toLowerCase();
            const director = String(movie.Director || '').toLowerCase();
            const genreStr = String(movie.Genre || '').toLowerCase();
            const catStr = String(movie.Category || '').toLowerCase();

            const matchesTitle = titleQuery === '' || title.includes(titleQuery);
            const matchesDirector = directorQuery === '' || director.includes(directorQuery);

            // Matches any of the exact Category pills AND matches active fuzzy text
            let matchesExactCat = selectedCategories.length === 0 || selectedCategories.some(c => movie.Category === c);
            let matchesFuzzyCat = fuzzyCategory === '' || catStr.includes(fuzzyCategory);
            const matchesCategory = matchesExactCat && matchesFuzzyCat;

            // Matches any of the exact Genre pills AND matches active fuzzy text
            let matchesExactGenre = true;
            if (selectedGenres.length > 0) {
                if (!movie.Genre) {
                    matchesExactGenre = false;
                } else {
                    matchesExactGenre = selectedGenres.some(pill => movie.Genre.trim() === pill);
                }
            }

            let matchesFuzzyGenre = fuzzyGenre === '' || genreStr.includes(fuzzyGenre);
            const matchesGenre = matchesExactGenre && matchesFuzzyGenre;

            let matchesYear = true;
            if (movie.Year) {
                const movieYear = parseInt(movie.Year, 10);
                if (!isNaN(minYearVal) && movieYear < minYearVal) matchesYear = false;
                if (!isNaN(maxYearVal) && movieYear > maxYearVal) matchesYear = false;
            } else if (!isNaN(minYearVal) || !isNaN(maxYearVal)) {
                // If a year filter is active but movie has no year
                matchesYear = false;
            }

            let matchesRank = true;
            const minRankVal = parseInt(rankMinInput.value, 10);
            const maxRankVal = parseInt(rankMaxInput.value, 10);
            if (movie.Rank) {
                const movieRank = parseInt(movie.Rank, 10);
                if (!isNaN(minRankVal) && movieRank < minRankVal) matchesRank = false;
                if (!isNaN(maxRankVal) && movieRank > maxRankVal) matchesRank = false;
            } else if (!isNaN(minRankVal) || !isNaN(maxRankVal)) {
                matchesRank = false;
            }

            return matchesTitle && matchesDirector && matchesCategory && matchesGenre && matchesYear && matchesRank;
        });

        // Deduplicate movies by Title, grouping their Categories and Metrics
        const uniqueMoviesMap = new Map();
        filteredMovies.forEach(movie => {
            const t = movie.Title.toLowerCase();
            if (!uniqueMoviesMap.has(t)) {
                uniqueMoviesMap.set(t, {
                    ...movie,
                    AggregatedData: [{
                        Category: movie.Category,
                        Rank: movie.Rank,
                        Color: movie.Color,
                        Metrics: movie.Metrics
                    }]
                });
            } else {
                uniqueMoviesMap.get(t).AggregatedData.push({
                    Category: movie.Category,
                    Rank: movie.Rank,
                    Color: movie.Color,
                    Metrics: movie.Metrics
                });
            }
        });
        filteredMovies = Array.from(uniqueMoviesMap.values());

        // Apply Min Categories Filter
        const minCatVal = parseInt(minCatInput.value, 10);
        if (!isNaN(minCatVal) && minCatVal > 1) {
            filteredMovies = filteredMovies.filter(m => m.AggregatedData && m.AggregatedData.length >= minCatVal);
        }

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
        let label = selectedCategories.length > 0 ? selectedCategories.join(', ') : 'All Categories';
        if (fuzzyCategory) label += ` + "${fuzzyCategory}"`;
        currentCategoryText.textContent = label;
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

    function getGenreClass(genreStr) {
        if (!genreStr) return 'genre-drama';
        const g = genreStr.toLowerCase();
        if (g.includes('sci-fi') || g.includes('fantasy') || g.includes('alien') || g.includes('space') || g.includes('superhero')) return 'scifi';
        if (g.includes('action') || g.includes('adventure') || g.includes('war') || g.includes('spy') || g.includes('disaster')) return 'action';
        if (g.includes('horror') || g.includes('thriller') || g.includes('vampire') || g.includes('zombie')) return 'horror';
        if (g.includes('comedy') || g.includes('musical') || g.includes('satire') || g.includes('animation')) return 'comedy';
        return 'drama';
    }

    function createMovieCardElement(movie) {
        const card = document.createElement('div');

        const exactGenre = movie.Genre || 'Unknown Genre';
        const genreClass = getGenreClass(exactGenre);

        if (movie.Year) {
            let decade = Math.floor(parseInt(movie.Year, 10) / 10) * 10;
            if (decade < 1920) decade = 1920;
            if (decade > 2020) decade = 2020;

            card.style.setProperty('--exact-bg', `url('assets/${genreClass}/${decade}/bg.png')`);
        }

        let isMulti = movie.AggregatedData && movie.AggregatedData.length > 1;
        const primaryData = (movie.AggregatedData && movie.AggregatedData[0]) || movie;

        if (primaryData.Color) {
            // Apply category-driven hex color if available
            card.style.setProperty('--accent', primaryData.Color);
        }

        card.className = `movie-card genre-${genreClass}`;

        card.innerHTML = `
            <div class="category-indicator" ${primaryData.Color ? `style="background-color: ${primaryData.Color}"` : ''}></div>
            <div class="card-header">
                <div class="rank-badge" ${isMulti ? 'style="font-size:0.75rem; padding: 0.3rem 0.5rem;"' : ''}>${isMulti ? 'Multi' : '#' + (primaryData.Rank || '-')}</div>
                <div class="year-badge">${movie.Year || 'N/A'}</div>
            </div>
            <div class="category-tag">${exactGenre}</div>
            <h3 class="movie-title">${movie.Title || 'Unknown Title'}</h3>
            <p class="movie-director">Directed by ${movie.Director || 'Unknown'}</p>
            <p class="movie-description">${movie.Description || ''}</p>
            <div class="movie-note">
                <span class="movie-note-type" ${primaryData.Color ? `style="color: ${primaryData.Color}"` : ''}>${isMulti ? 'Multiple Categories' : (primaryData.Category ? primaryData.Category.replace('Top 10 ', '') : 'Details')}</span>
                <div class="movie-stats">
                    ${getStatsHtml(movie)}
                </div>
            </div>
        `;
        return card;
    }

    function renderMovies() {
        // Remove existing load more button if present
        const currentBtn = document.querySelector('.load-more-btn');
        if (currentBtn) currentBtn.remove();

        const limit = Math.min(filteredMovies.length, currentlyDisplayed + LOAD_CHUNK);

        const fragment = document.createDocumentFragment();

        for (let i = currentlyDisplayed; i < limit; i++) {
            fragment.appendChild(createMovieCardElement(filteredMovies[i]));
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
        if (!movie.AggregatedData || movie.AggregatedData.length === 0) return '';

        let statsHtml = '';
        movie.AggregatedData.forEach(data => {
            const isFirst = statsHtml === '';
            statsHtml += `<div style="${!isFirst ? 'margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1);' : ''}">`;
            statsHtml += `<div style="color: ${data.Color || 'var(--text-secondary)'}; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.2rem;">${data.Category ? data.Category.replace('Top 10 ', '') : 'Details'} - Rank #${data.Rank || '-'}</div>`;

            if (data.Metrics && data.Metrics.length > 0) {
                data.Metrics.forEach(metric => {
                    statsHtml += `<div style="font-size: 0.8rem; color: #ccc;"><strong>${metric.Label}:</strong> ${metric.Value}</div>`;
                });
            }
            statsHtml += `</div>`;
        });

        return statsHtml;
    }

});
