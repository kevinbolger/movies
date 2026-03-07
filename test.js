const fs = require('fs');

// Mock DOM
let movieGridInnerHTML = "";
let fragment = [];

const dataCode = fs.readFileSync('data.js', 'utf8');
eval(dataCode); // populates ALL_MOVIES
const filteredMovies = ALL_MOVIES;

function getGenreColor(genreStr) {
    if (!genreStr) return 'hsl(0, 0%, 50%)';
    let hash = 0;
    for (let i = 0; i < genreStr.length; i++) {
        hash = genreStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    const s = 70 + (Math.abs(hash) % 20);
    return `hsl(${h}, ${s}%, 60%)`;
}

function getFallbackImage(genreStr) {
    if (!genreStr) return 'bg_drama.png';
    const g = genreStr.toLowerCase();
    if (g.includes('sci-fi') || g.includes('fantasy') || g.includes('alien') || g.includes('space') || g.includes('superhero')) return 'bg_scifi.png';
    if (g.includes('action') || g.includes('adventure') || g.includes('war') || g.includes('spy') || g.includes('disaster')) return 'bg_action.png';
    if (g.includes('horror') || g.includes('thriller') || g.includes('vampire') || g.includes('zombie')) return 'bg_horror.png';
    if (g.includes('comedy') || g.includes('musical') || g.includes('satire') || g.includes('animation')) return 'bg_comedy.png';
    return 'bg_drama.png';
}

function getGenreGradient(genreStr) {
    if (!genreStr) return 'linear-gradient(135deg, #1e1e24 0%, #0a0a0f 100%)';
    let hash = 0;
    for (let i = 0; i < genreStr.length; i++) {
        hash = genreStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h1 = Math.abs(hash) % 360;
    const h2 = (h1 + 40) % 360;
    const s = 60 + (Math.abs(hash) % 20);
    return `linear-gradient(135deg, hsl(${h1}, ${s}%, 18%) 0%, hsl(${h2}, ${s}%, 28%) 100%)`;
}

function getStatsHtml(movie) {
    let statsHtml = '';
    return statsHtml; // Simplified
}

try {
    const limit = Math.min(filteredMovies.length, 100);
    for (let i = 0; i < limit; i++) {
        const movie = filteredMovies[i];
        
        const exactGenre = movie.Genre || 'Unknown Genre';
        const safeGenreFolder = exactGenre.toLowerCase().replace(/[\/\\]/g, '-');
        const fallbackImg = getFallbackImage(exactGenre);

        const dynamicGradient = getGenreGradient(exactGenre);
        const dynamicColor = getGenreColor(exactGenre);

        let bgImageStyle = '';
        if (movie.Year) {
            let decade = Math.floor(parseInt(movie.Year, 10) / 10) * 10;
            if (decade < 1920) decade = 1920;
            if (decade > 2020) decade = 2020;
            bgImageStyle = `style="background-image: linear-gradient(to top, rgba(10, 10, 15, 0.95) 0%, rgba(10, 10, 15, 0.45) 100%), url('assets/${safeGenreFolder}/${decade}/bg.png'), url('assets/${fallbackImg}'), ${dynamicGradient}; background-size: cover; background-position: center;"`;
        } else {
            bgImageStyle = `style="background-image: linear-gradient(to top, rgba(10, 10, 15, 0.95) 0%, rgba(10, 10, 15, 0.45) 100%), url('assets/${fallbackImg}'), ${dynamicGradient}; background-size: cover; background-position: center;"`;
        }

        let innerHTML = `
            <div class="card-bg" ${bgImageStyle}></div>
            <div class="category-indicator" style="background-color: ${dynamicColor}; box-shadow: 0 0 10px ${dynamicColor};"></div>
            <div class="card-header">
                <div class="rank-badge">#${movie.Rank || '-'}</div>
                <div class="year-badge">${movie.Year || 'N/A'}</div>
            </div>
            <!-- Hack simple HSLA conversion by replacing hsl -> hsla and ) -> , 0.15) -->
            <div class="category-tag" style="color: ${dynamicColor}; background: ${dynamicColor.replace('hsl', 'hsla').replace(')', ', 0.15)')};">${exactGenre}</div>
            <h3 class="movie-title">${movie.Title || 'Unknown Title'}</h3>
            <p class="movie-director">Directed by ${movie.Director || 'Unknown'}</p>
        `;
        fragment.push(innerHTML);
    }
    console.log("Successfully rendered " + fragment.length + " items");
} catch(e) {
    console.log("ERROR OCCURRED: " + e.message);
}

