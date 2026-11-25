(() => {
  const like = [...document.querySelectorAll('button')].find(b => /like/i.test(b.textContent));
  const save = document.querySelector('button[aria-label="Save to Favourites"]');
  const fullscreen = document.querySelector('button[aria-label="Fullscreen"]');
  if (like) like.addEventListener('click', () => {
    const count = like.querySelector('[data-design-text-token]') || like;
    const liked = like.dataset.liked === 'true';
    like.dataset.liked = String(!liked);
    like.setAttribute('aria-pressed', String(!liked));
    if (!liked) count.textContent = count.textContent.replace(/^(\d[\d,]*)/, n => (Number(n.replace(/,/g,''))+1).toLocaleString()) || 'Liked';
    else count.textContent = count.textContent.replace(/^(\d[\d,]*)/, n => Math.max(0,Number(n.replace(/,/g,''))-1).toLocaleString());
  });
  if (save) save.addEventListener('click', () => {
    const saved = save.dataset.saved === 'true';
    save.dataset.saved = String(!saved);
    save.setAttribute('aria-pressed', String(!saved));
    save.title = saved ? 'Save to Favourites' : 'Saved to Favourites';
  });
  if (fullscreen) fullscreen.addEventListener('click', () => {
    const target = document.querySelector('iframe') || document.querySelector('main section');
    if (target?.requestFullscreen) target.requestFullscreen().catch(() => {});
  });
  const search = document.querySelector('input[type="search"][aria-label="Search games"]');
  if(search) search.addEventListener('keydown',e=>{if(e.key==='Enter'&&search.value.trim()) location.href='/index.html?search='+encodeURIComponent(search.value.trim())});
})();