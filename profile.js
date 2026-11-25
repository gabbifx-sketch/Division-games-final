(() => {
 const tabs=[...document.querySelectorAll('[role="tab"]')];
 const panels=[...document.querySelectorAll('[role="tabpanel"]')];
 tabs.forEach((tab,index)=>tab.addEventListener('click',()=>{
  tabs.forEach((t,i)=>{t.setAttribute('aria-selected',String(i===index));t.classList.toggle('bg-navy-ink',i===index);t.classList.toggle('text-light-surface-container-lowest',i===index)});
  panels.forEach((p,i)=>p.hidden=i!==index);
 }));
})();