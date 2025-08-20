
(function () {
    const API = "";
    const PAGE_SIZE = 24;

    const grid = document.getElementById('grid');
    const searchInput = document.getElementById('search');
    const loadMoreBtn = document.getElementById('loadMore');
    const refreshBtn = document.getElementById('refresh');
    const loader = document.getElementById('loader');
    const counter = document.getElementById('counter');

    let offset = 0;
    let all = [];          // full list of fetched pokemon (detail objects)
    let cache = new Map(); // name -> detail

    function showLoader(show) { loader.classList.toggle('hidden', !show); }
    function fmtId(num) { return '#' + String(num).padStart(4, '0'); }

    function createCard(p) {
        const img =
            (p.sprites?.other?.['official-artwork']?.front_default) ||
            (p.sprites?.other?.dream_world?.front_default) ||
            (p.sprites?.front_default) ||
            '';

        const types = (p.types || []).map(t => t.type?.name);
        const card = document.createElement('article');
        card.className = 'card';
        card.setAttribute('tabindex', '0');
        card.innerHTML = `
          <div class="sprite-wrap">
            ${img ? `<img class="sprite" loading="lazy" decoding="async" alt="${p.name} sprite" src="${img}">`
                : `<div class="sprite" aria-hidden="true"></div>`}
          </div>
          <div class="meta">
            <div class="name">${p.name}</div>
            <div class="id">${fmtId(p.id)}</div>
          </div>
          <div class="types">
            ${types.map(t => `<span class="type">${t}</span>`).join('')}
          </div>
        `;
        return card;
    }

    function render(list) {
        grid.innerHTML = '';
        const frag = document.createDocumentFragment();
        list.forEach(p => frag.appendChild(createCard(p)));
        grid.appendChild(frag);
        counter.textContent = `${list.length} ${list.length === 1 ? 'loaded' : 'loaded'}`;
    }

    function append(newOnes) {
        const frag = document.createDocumentFragment();
        newOnes.forEach(p => frag.appendChild(createCard(p)));
        grid.appendChild(frag);
        counter.textContent = `${all.length} loaded`;
    }

    async function fetchPage() {
        showLoader(true);
        try {
            const res = await fetch(`${API}?limit=${PAGE_SIZE}&offset=${offset}`);
            if (!res.ok) throw new Error('Network error');
            const data = await res.json();
            const details = await Promise.all(
                data.results.map(async (item) => {
                    if (cache.has(item.name)) return cache.get(item.name);
                    const r = await fetch(item.url);
                    const d = await r.json();
                    cache.set(item.name, d);
                    return d;
                })
            );
            all = all.concat(details);
            append(details);
            offset += PAGE_SIZE;
        } catch (err) {
            alert('Failed to load Pokémon. Please try again.');
            console.error(err);
        } finally {
            showLoader(false);
        }
    }

    function handleSearch() {
        const q = searchInput.value.trim().toLowerCase();
        if (!q) { render(all); return; }
        const filtered = all.filter(p => p.name.includes(q));
        render(filtered);
    }

    // Init: first page
    render([]); // start empty
    fetchPage();

    // Events
    loadMoreBtn.addEventListener('click', fetchPage);
    refreshBtn.addEventListener('click', () => {
        offset = 0; all = []; cache.clear(); grid.innerHTML = ''; counter.textContent = '0 loaded'; fetchPage();
    });
    searchInput.addEventListener('input', handleSearch);

    // Optional: infinite scroll
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;
            if (nearBottom && !loader.classList.contains('hidden')) { /* already loading */ }
            else if (nearBottom) { fetchPage(); }
            ticking = false;
        });
    }, { passive: true });
})();
