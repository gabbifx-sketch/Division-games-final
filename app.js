(() => {
  const search = document.querySelector('input[type="search"][aria-label="Search games"]');
  const cards = [...document.querySelectorAll('main a[href="/game.html"], main a[href^="/game.html?"]')];
  cards.forEach(card => {
    const label = card.querySelector('h2,h3,h4,[data-design-text-token]')?.textContent?.trim() || card.getAttribute('aria-label') || card.textContent.trim();
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    card.href = '/game.html?id=' + encodeURIComponent(slug);
    card.addEventListener('click', () => { try { sessionStorage.setItem('division:last-game', label); } catch {} });
  });
  if (search) {
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      cards.forEach(card => {
        const match = !q || card.textContent.toLowerCase().includes(q);
        card.hidden = !match;
      });
      document.querySelectorAll('main section').forEach(section => {
        const sectionCards = [...section.querySelectorAll('a[href^="/game.html"]')];
        if (sectionCards.length) section.hidden = sectionCards.every(card => card.hidden);
      });
    });
    search.addEventListener('keydown', e => {
      if (e.key === 'Escape') { search.value=''; search.dispatchEvent(new Event('input')); }
    });
  }
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='k' && search) { e.preventDefault(); search.focus(); }
  });
})();