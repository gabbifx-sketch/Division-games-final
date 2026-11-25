(() => {
  const search = document.querySelector('input[aria-label="Search admin games"]');
  const rows = [...document.querySelectorAll('tbody tr')];
  if (search) search.addEventListener('input', () => {
    const q=search.value.trim().toLowerCase();
    rows.forEach(row => row.hidden=!row.textContent.toLowerCase().includes(q));
  });
  document.querySelectorAll('button').forEach(button => {
    if (/delete|remove/i.test(button.textContent.trim())) button.addEventListener('click', () => {
      const row=button.closest('tr, [class*="rounded-lg"]');
      if (row && confirm('Remove this item from this demo view?')) row.remove();
    });
  });
  document.querySelectorAll('a[href="#add-game"]').forEach(link => link.addEventListener('click',e=>{
    e.preventDefault();
    alert('Game creation will be enabled when the admin form and database are connected.');
  }));
})();