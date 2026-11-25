(async()=>{
const $=s=>document.querySelector(s),note=$("#communityNote"),list=$("#commentList"),input=$("#commentText"),button=$("#postComment");
const say=m=>{if(note)note.textContent=m};
const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
try{
 const sb=await window.divisionSupabaseReady,{data:{user}}=await sb.auth.getUser();
 const key=new URLSearchParams(location.search).get("id")||"drift-king";
 let q=sb.from("games").select("id,title,slug").eq("is_published",true);
 q=/^[0-9a-f-]{36}$/i.test(key)?q.eq("id",key):q.eq("slug",key);
 const {data:game}=await q.maybeSingle();if(!game){say("This game could not be found.");return}
 const heading=document.querySelector(".community-banner h1");if(heading)heading.textContent=game.title+" — Community";
 const back=document.querySelector(".comments-reference .back-pill");if(back)back.href="game.html?id="+encodeURIComponent(game.slug||game.id);
 if(!user){input.placeholder="Log in to join the conversation";button.textContent="Log in to comment";button.onclick=()=>location.href="login.html"}
 else button.addEventListener("click",()=>post(null));
 async function post(parentId){
  const body=input.value.trim();if(!body)return say("Write something first.");if(body.length>2000)return say("Keep comments under 2,000 characters.");
  button.disabled=true;const {error}=await sb.from("comments").insert({game_id:game.id,user_id:user.id,body,parent_id:parentId});button.disabled=false;
  if(error)return say(error.message);input.value="";say("Posted.");await load();
 }
 async function load(){
  const [{data:comments,error},{count:likes}]=await Promise.all([
   sb.from("comments").select("id,body,parent_id,created_at,user_id,profiles(username,first_name,last_name,avatar_url)").eq("game_id",game.id).order("created_at",{ascending:true}),
   sb.from("likes").select("user_id",{count:"exact",head:true}).eq("game_id",game.id)
  ]);
  if(error){say(error.message);return}
  const summary=document.querySelector(".like-summary span");if(summary)summary.textContent=(likes||0)+" Game Likes";
  const ids=(comments||[]).map(c=>c.id);let likesByComment={};
  if(ids.length){const {data:rows,error:likeError}=await sb.from("comment_likes").select("comment_id,user_id").in("comment_id",ids);if(likeError)say(likeError.message);(rows||[]).forEach(x=>{likesByComment[x.comment_id]??={count:0,mine:false};likesByComment[x.comment_id].count++;if(user&&x.user_id===user.id)likesByComment[x.comment_id].mine=true})}
  const roots=(comments||[]).filter(c=>!c.parent_id),children=(comments||[]).filter(c=>c.parent_id);
  function render(c){
   const p=c.profiles||{},name=p.username||((p.first_name||"")+" "+(p.last_name||"")).trim()||"Player",avatar=p.avatar_url?'<img src="'+esc(p.avatar_url)+'" alt="">':esc(name.slice(0,1).toUpperCase()),lk=likesByComment[c.id]||{count:0,mine:false};
   return '<article class="comment-item" data-id="'+c.id+'"><div class="comment-avatar">'+avatar+'</div><div class="comment-content"><div class="comment-meta"><b>'+esc(name)+'</b><small>'+new Date(c.created_at).toLocaleString()+'</small></div><p>'+esc(c.body)+'</p><div class="comment-tools"><button type="button" data-like="'+c.id+'">'+(lk.mine?"♥":"♡")+' Like ('+lk.count+')</button>'+(user?'<button type="button" data-reply="'+c.id+'">↳ Reply</button>':"")+(user&&user.id===c.user_id?'<button type="button" data-delete="'+c.id+'">Delete</button>':"")+'</div><div class="reply-box" data-reply-box="'+c.id+'" hidden><textarea maxlength="2000" placeholder="Write a reply…"></textarea><button type="button" class="solid-pill" data-send-reply="'+c.id+'">Reply</button></div><div class="comment-replies">'+children.filter(x=>x.parent_id===c.id).map(render).join("")+'</div></div></article>';
  }
  list.innerHTML=roots.map(render).join("")||'<p class="muted-copy">No comments yet. Start the conversation.</p>';
 }
 list.addEventListener("click",async e=>{
  const like=e.target.closest("[data-like]"),reply=e.target.closest("[data-reply]"),send=e.target.closest("[data-send-reply]"),del=e.target.closest("[data-delete]");
  if(like){if(!user)return location.href="login.html";const id=like.dataset.like,{data:existing}=await sb.from("comment_likes").select("comment_id").eq("comment_id",id).eq("user_id",user.id).maybeSingle();const result=existing?await sb.from("comment_likes").delete().eq("comment_id",id).eq("user_id",user.id):await sb.from("comment_likes").insert({comment_id:id,user_id:user.id});if(result.error)say(result.error.message);else await load()}
  if(reply){const box=list.querySelector('[data-reply-box="'+reply.dataset.reply+'"]');box.hidden=!box.hidden;box.querySelector("textarea").focus()}
  if(send){const box=list.querySelector('[data-reply-box="'+send.dataset.sendReply+'"]'),body=box.querySelector("textarea").value.trim();if(!body)return say("Write a reply first.");const {error}=await sb.from("comments").insert({game_id:game.id,user_id:user.id,body,parent_id:send.dataset.sendReply});if(error)say(error.message);else{say("Reply posted.");await load()}}
  if(del&&confirm("Delete this comment?")){const {error}=await sb.from("comments").delete().eq("id",del.dataset.delete).eq("user_id",user.id);if(error)say(error.message);else await load()}
 });
 await load();
}catch(e){say(e.message||"Could not load community.")}
})();