(() => {
 const formButton=[...document.querySelectorAll('button')].find(b=>/post comment|submit comment/i.test(b.textContent));
 const box=document.querySelector('textarea[aria-label="Write a comment"]');
 if(formButton&&box) formButton.addEventListener('click',()=>{
   const value=box.value.trim(); if(!value){box.focus();return;}
   const area=box.closest('section')||box.parentElement.parentElement;
   const item=document.createElement('article'); item.className='mt-4 rounded-lg bg-light-surface-container-low p-4';
   const name=document.createElement('strong'); name.textContent='You';
   const body=document.createElement('p'); body.className='mt-2'; body.textContent=value;
   item.append(name,body); area.append(item); box.value='';
 });
 document.querySelectorAll('button').forEach(b=>{if(/like/i.test(b.textContent))b.addEventListener('click',()=>{const on=b.getAttribute('aria-pressed')==='true';b.setAttribute('aria-pressed',String(!on));b.classList.toggle('opacity-60',!on)})});
})();