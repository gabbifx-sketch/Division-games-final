(async()=>{
const $=s=>document.querySelector(s),esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const note=$("#profileNote"),say=m=>{if(note)note.textContent=m};
const isProfilePage=!!$("#profileForm");
try{
 const sb=await window.divisionSupabaseReady,adminLinks=[...document.querySelectorAll("[data-admin-only]")];
 adminLinks.forEach(a=>a.hidden=true);
 const {data:{user}}=await sb.auth.getUser();
 if(!user){if(isProfilePage)location.href="login.html";return}
 const {data:role}=await sb.from("admin_roles").select("role").eq("user_id",user.id).maybeSingle();
 if(role&&role.role==="admin")adminLinks.forEach(a=>a.hidden=false);
 if(!isProfilePage)return;
 let {data:p,error}=await sb.from("profiles").select("user_id,username,first_name,last_name,avatar_url,bio").eq("user_id",user.id).maybeSingle();
 if(error)throw error;if(!p)throw new Error("Your player profile could not be found.");
 const label=p.username||user.email.split("@")[0];
 function setAvatar(url){
  ["profileAvatar","editAvatarPreview"].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=url?'<img src="'+esc(url)+'" alt="Profile photo">':esc(label.slice(0,1).toUpperCase())});
  const dot=document.querySelector(".profile-dot");if(dot)dot.innerHTML=url?'<img src="'+esc(url)+'" alt="">':esc(label.slice(0,1).toUpperCase());
 }
 function paint(){
  const name=((p.first_name||"")+" "+(p.last_name||"")).trim()||label;
  if($("#profileName"))$("#profileName").textContent=name;
  if($("#profileHandle"))$("#profileHandle").textContent="@"+label+" · Division Player";
  const pill=document.querySelector(".profile-pill");if(pill){pill.href="profile.html";pill.innerHTML='<span class="profile-dot"></span><span>'+esc(label)+'</span>'}
  setAvatar(p.avatar_url);
  if($("#firstName"))$("#firstName").value=p.first_name||"";
  if($("#lastName"))$("#lastName").value=p.last_name||"";
  if($("#username"))$("#username").value=p.username||"";
  if($("#bio"))$("#bio").value=p.bio||"";
 }
 paint();
 $("#signOutBtn")?.addEventListener("click",async()=>{await sb.auth.signOut();location.href="index.html"});
 $("#profileForm")?.addEventListener("submit",async e=>{
  e.preventDefault();const b=$("#saveProfile");b.disabled=true;const original=b.textContent;b.textContent="Saving…";
  try{const username=$("#username").value.trim();if(!/^[A-Za-z0-9_]{3,20}$/.test(username))throw new Error("Username must be 3–20 letters, numbers or underscores.");
   const patch={first_name:$("#firstName").value.trim(),last_name:$("#lastName").value.trim(),username,bio:$("#bio").value.trim(),updated_at:new Date().toISOString()};
   const {error}=await sb.from("profiles").update(patch).eq("user_id",user.id);if(error)throw error;p={...p,...patch};paint();say("Profile updated successfully.");
  }catch(err){say(err.message||"Could not save profile.")}finally{b.disabled=false;b.textContent=original}
 });
 $("#avatarFile")?.addEventListener("change",async e=>{
  const file=e.target.files&&e.target.files[0];if(!file)return;
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)){say("Choose a JPG, PNG or WebP image.");return}
  if(file.size>5*1024*1024){say("Profile photos must be 5 MB or smaller.");return}
  const ext=file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpg",path=user.id+"/avatar."+ext;say("Uploading photo…");
  try{const bucket=sb.storage.from("division-avatars"),{error:upErr}=await bucket.upload(path,file,{upsert:true,contentType:file.type,cacheControl:"3600"});if(upErr)throw upErr;
   const {data}=bucket.getPublicUrl(path),url=data.publicUrl+"?v="+Date.now();
   const {error:dbErr}=await sb.from("profiles").update({avatar_url:url,updated_at:new Date().toISOString()}).eq("user_id",user.id);if(dbErr)throw dbErr;p.avatar_url=url;paint();say("Profile photo updated.");
  }catch(err){say(err.message||"Photo upload failed.")}finally{e.target.value=""}
 });
 const [fav,likes,played]=await Promise.all([
  sb.from("favorites").select("game_id,games(id,title,slug,thumbnail_url)").eq("user_id",user.id),
  sb.from("likes").select("game_id",{count:"exact",head:true}).eq("user_id",user.id),
  sb.from("recently_played").select("game_id,last_played_at,games(id,title,slug,thumbnail_url)").eq("user_id",user.id).order("last_played_at",{ascending:false}).limit(8)
 ]);
 if($("#favCount"))$("#favCount").textContent=(fav.data||[]).length;if($("#likeCount"))$("#likeCount").textContent=likes.count||0;if($("#playedCount"))$("#playedCount").textContent=(played.data||[]).length;
 const favList=$("#favouritesList");if(favList&&fav.data&&fav.data.length)favList.innerHTML=fav.data.map(x=>x.games?'<a class="solid-pill profile-game-link" href="game.html?id='+encodeURIComponent(x.games.slug||x.games.id)+'">'+esc(x.games.title)+'</a>':"").join("");
 const recent=$("#recentGames");if(recent&&played.data&&played.data.length)recent.innerHTML=played.data.map(x=>x.games?'<a class="recent-game-link" href="game.html?id='+encodeURIComponent(x.games.slug||x.games.id)+'">'+(x.games.thumbnail_url?'<img src="'+esc(x.games.thumbnail_url)+'" alt="">':"")+'<span>'+esc(x.games.title)+'</span></a>':"").join("");
}catch(e){console.error(e);say(e.message||"Could not load your profile.")}
})();