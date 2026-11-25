(async function(){
const $=s=>document.querySelector(s),body=$("#gameTable"),note=$("#adminNote");
const say=(m,bad)=>{if(note){note.textContent=m;note.classList.toggle("error",!!bad)}};
let sb;try{sb=await window.divisionSupabaseReady}catch(e){location.href="../login.html";return}
const {data:{user},error:ae}=await sb.auth.getUser();if(ae||!user){location.href="../login.html?next=admin";return}
const {data:role,error:re}=await sb.from("admin_roles").select("role").eq("user_id",user.id).maybeSingle();
if(re||!role||role.role!=="admin"){document.body.innerHTML='<main style="max-width:600px;margin:12vh auto;padding:24px;font:16px Arial"><h1>Admin access required</h1><p>This account does not have Division administrator permissions.</p><a href="../index.html">Return to Division</a></main>';return}
const {data:profile}=await sb.from("profiles").select("username").eq("user_id",user.id).maybeSingle();
const tag=$(".connected-tag");if(tag)tag.textContent="● Signed in as "+(profile&&profile.username||user.email);
function esc(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function slugify(s){return String(s||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
let categories=[];
async function load(){
const res=await Promise.all([
sb.from("games").select("id,title,slug,thumbnail_url,is_published,is_featured,created_at,categories(name)").order("created_at",{ascending:false}),
sb.from("profiles").select("user_id,username,first_name,last_name,status,created_at").order("created_at",{ascending:false}).limit(10),
sb.from("likes").select("user_id",{count:"exact",head:true}),
sb.from("comments").select("id,body,created_at,profiles(username),games(title)",{count:"exact"}).order("created_at",{ascending:false}).limit(10),
sb.from("profiles").select("user_id",{count:"exact",head:true})
]);
const games=res[0].data||[],users=res[1].data||[],comments=res[3].data||[];
if(res[0].error){say(res[0].error.message,true);return}
const nums=[games.length,res[4].count||0,res[2].count||0,res[3].count||0],k=document.querySelectorAll(".admin-kpis article b");
nums.forEach((n,i)=>{if(k[i])k[i].textContent=n});
body.innerHTML=games.map(g=>'<tr><td><div class="admin-game-cell">'+(g.thumbnail_url?'<img src="'+esc(g.thumbnail_url)+'" alt="">':'<span class="admin-game-placeholder">🎮</span>')+'<span><b>'+esc(g.title)+'</b><small>'+esc(g.slug)+'</small></span></div></td><td>'+esc(g.categories&&g.categories.name||"Uncategorised")+'</td><td>'+(g.is_featured?'<span class="admin-featured">Featured</span>':"—")+'</td><td><span class="admin-status '+(g.is_published?"is-live":"is-draft")+'">'+(g.is_published?"Published":"Draft")+'</span></td><td><div class="admin-row-actions"><button class="table-action" data-edit="'+g.id+'">Edit</button><button class="table-action" data-publish="'+g.id+'" data-state="'+g.is_published+'">'+(g.is_published?"Unpublish":"Publish")+'</button><button class="table-action danger-action" data-delete="'+g.id+'">Delete</button></div></td></tr>').join("")||'<tr><td colspan="5">No games yet. Add your first game.</td></tr>';
$("#adminUsers").innerHTML=users.map(u=>'<div class="admin-list-row"><span><b>'+esc(u.username||"Player")+'</b><small>'+esc(((u.first_name||"")+" "+(u.last_name||"")).trim())+'</small></span><button class="table-action" data-user="'+u.user_id+'" data-status="'+u.status+'">'+(u.status==="suspended"?"Reactivate":"Suspend")+'</button></div>').join("")||"<p>No players registered.</p>";
$("#adminComments").innerHTML=comments.map(c=>'<div class="admin-comment-row"><b>'+esc(c.profiles&&c.profiles.username||"Player")+'</b><small> · '+esc(c.games&&c.games.title||"Game")+'</small><p>'+esc(c.body)+'</p><button class="table-action danger-action" data-comment="'+c.id+'">Remove comment</button></div>').join("")||"<p>No comments yet.</p>";
}
async function getCategories(){
const {data,error}=await sb.from("categories").select("id,name").order("name");
if(error)throw error;categories=data||[];
}
function ensureModal(){
let modal=$("#gameEditor");if(modal)return modal;
modal=document.createElement("div");modal.id="gameEditor";modal.className="game-editor-overlay";modal.hidden=true;
modal.innerHTML='<section class="game-editor" role="dialog" aria-modal="true" aria-labelledby="gameEditorTitle"><header class="game-editor-head"><div><span class="eyebrow">DIVISION CATALOGUE</span><h2 id="gameEditorTitle">Add a new game</h2><p>Fill in the details players will see.</p></div><button type="button" class="game-editor-close" aria-label="Close editor">×</button></header><form id="gameEditorForm"><div class="game-editor-layout"><div class="game-editor-fields"><label>Game title <input name="title" required maxlength="90" placeholder="e.g. Drift King"></label><div class="game-editor-two"><label>URL slug <input name="slug" required maxlength="100" placeholder="drift-king"></label><label>Category <input name="category" list="gameCategories" required placeholder="Arcade"><datalist id="gameCategories"></datalist></label></div><label>Short description <textarea name="description" rows="3" maxlength="500" placeholder="What is this game about?"></textarea></label><div class="game-editor-two"><label>Developer <input name="developer" maxlength="100" placeholder="Game developer"></label><label>Tags <input name="tags" placeholder="racing, 3D, cars"></label></div><label>Game embed / playable URL <input name="embed_url" type="url" placeholder="https://..."></label><label>Gameplay video URL <input name="gameplay_video_url" type="url" placeholder="https://..."></label><label>Cover image URL <input name="thumbnail_url" type="url" placeholder="https://..."></label><label>How to play <textarea name="instructions" rows="3" maxlength="1200" placeholder="Explain the objective and gameplay"></textarea></label><label>Controls <textarea name="controls" rows="2" maxlength="500" placeholder="WASD to move, Space to jump..."></textarea></label></div><aside class="game-editor-preview"><span class="preview-label">COVER PREVIEW</span><div class="game-cover-preview" id="gameCoverPreview"><span>🎮</span></div><p>Paste a public image URL to preview the cover.</p><div class="game-editor-switches"><label><input type="checkbox" name="is_featured"> Featured game</label><label><input type="checkbox" name="is_popular"> Popular</label><label><input type="checkbox" name="is_recommended"> Recommended</label><label><input type="checkbox" name="is_multiplayer"> Multiplayer</label><label><input type="checkbox" name="is_published" checked> Publish immediately</label></div></aside></div><footer class="game-editor-footer"><p id="gameEditorNote" role="status"></p><div><button type="button" class="editor-cancel">Cancel</button><button type="submit" class="solid-pill" id="saveGameBtn">Save game</button></div></footer></form></section>';
document.body.appendChild(modal);
const close=()=>{modal.hidden=true;document.body.classList.remove("editor-open")};
modal.querySelector(".game-editor-close").addEventListener("click",close);modal.querySelector(".editor-cancel").addEventListener("click",close);
modal.addEventListener("click",e=>{if(e.target===modal)close()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal.hidden)close()});
const title=modal.querySelector('[name="title"]'),slug=modal.querySelector('[name="slug"]'),image=modal.querySelector('[name="thumbnail_url"]'),preview=modal.querySelector("#gameCoverPreview");
title.addEventListener("input",()=>{if(!slug.dataset.touched)slug.value=slugify(title.value)});
slug.addEventListener("input",()=>{slug.dataset.touched="1";slug.value=slugify(slug.value)});
image.addEventListener("input",()=>{const url=image.value.trim();preview.innerHTML=url?'<img src="'+esc(url)+'" alt="Cover preview" onerror="this.parentElement.innerHTML=\'<span>Image unavailable</span>\'">':'<span>🎮</span>'});
modal.querySelector("#gameEditorForm").addEventListener("submit",saveGame);
return modal;
}
let editingId=null;
async function openEditor(old=null){
try{await getCategories()}catch(e){say(e.message,true);return}
const modal=ensureModal(),form=modal.querySelector("#gameEditorForm");editingId=old?old.id:null;form.reset();
modal.querySelector("#gameEditorTitle").textContent=old?"Edit game":"Add a new game";
modal.querySelector("#saveGameBtn").textContent=old?"Save changes":"Save game";
modal.querySelector("#gameEditorNote").textContent="";
const dl=modal.querySelector("#gameCategories");dl.innerHTML=categories.map(c=>'<option value="'+esc(c.name)+'"></option>').join("");
const fields=["title","slug","description","instructions","controls","developer","thumbnail_url","embed_url","gameplay_video_url"];
fields.forEach(k=>{form.elements[k].value=old&&old[k]||""});
form.elements.category.value=old&&old.categories&&old.categories.name||"Arcade";
form.elements.tags.value=old&&Array.isArray(old.tags)?old.tags.join(", "):"";
["is_featured","is_popular","is_recommended","is_multiplayer"].forEach(k=>form.elements[k].checked=!!(old&&old[k]));
form.elements.is_published.checked=old?!!old.is_published:true;
delete form.elements.slug.dataset.touched;
form.elements.thumbnail_url.dispatchEvent(new Event("input"));
modal.hidden=false;document.body.classList.add("editor-open");setTimeout(()=>form.elements.title.focus(),30);
}
async function saveGame(e){
e.preventDefault();const modal=$("#gameEditor"),form=e.currentTarget,btn=$("#saveGameBtn"),status=$("#gameEditorNote"),v=Object.fromEntries(new FormData(form).entries());
const categoryName=String(v.category||"").trim(),title=String(v.title||"").trim();
if(!title||!categoryName){status.textContent="Add a game title and category.";return}
const slug=slugify(v.slug||title);if(!slug){status.textContent="Enter a valid URL slug.";return}
for(const key of ["embed_url","gameplay_video_url","thumbnail_url"]){if(v[key]){try{const u=new URL(v[key]);if(!["http:","https:"].includes(u.protocol))throw 0}catch(_){status.textContent="Use valid http or https URLs for links and images.";return}}}
btn.disabled=true;btn.textContent="Saving…";status.textContent="";
try{
let cat=categories.find(c=>c.name.toLowerCase()===categoryName.toLowerCase());
if(!cat){const cr=await sb.from("categories").insert({name:categoryName,slug:slugify(categoryName)}).select("id,name").single();if(cr.error)throw cr.error;cat=cr.data;categories.push(cat)}
const payload={title,slug,description:String(v.description||"").trim()||null,instructions:String(v.instructions||"").trim()||null,controls:String(v.controls||"").trim()||null,developer:String(v.developer||"").trim()||null,thumbnail_url:String(v.thumbnail_url||"").trim()||null,embed_url:String(v.embed_url||"").trim()||null,gameplay_video_url:String(v.gameplay_video_url||"").trim()||null,category_id:cat.id,tags:String(v.tags||"").split(",").map(x=>x.trim()).filter(Boolean),is_featured:form.elements.is_featured.checked,is_popular:form.elements.is_popular.checked,is_recommended:form.elements.is_recommended.checked,is_multiplayer:form.elements.is_multiplayer.checked,is_published:form.elements.is_published.checked,updated_at:new Date().toISOString()};
const result=editingId?await sb.from("games").update(payload).eq("id",editingId):await sb.from("games").insert(payload);
if(result.error)throw result.error;
say(editingId?"Game changes saved.":"Game added successfully.");
modal.hidden=true;document.body.classList.remove("editor-open");await load();
}catch(err){status.textContent=err.message||"Could not save this game.";status.classList.add("error")}finally{btn.disabled=false;btn.textContent=editingId?"Save changes":"Save game"}
}
$("#addGame")?.addEventListener("click",()=>openEditor());
$("#addGameTop")?.addEventListener("click",()=>openEditor());
body.addEventListener("click",async e=>{
const del=e.target.closest("[data-delete]"),edit=e.target.closest("[data-edit]"),pub=e.target.closest("[data-publish]");
if(pub){const {error}=await sb.from("games").update({is_published:pub.dataset.state!=="true"}).eq("id",pub.dataset.publish);if(error)say(error.message,true);else{say("Game visibility updated.");load()}}
if(del&&confirm("Delete this game permanently?")){const {error}=await sb.from("games").delete().eq("id",del.dataset.delete);if(error)say(error.message,true);else{say("Game deleted.");load()}}
if(edit){const {data,error}=await sb.from("games").select("*,categories(name)").eq("id",edit.dataset.edit).single();if(error)say(error.message,true);else openEditor(data)}
});
$("#adminUsers").addEventListener("click",async e=>{const b=e.target.closest("[data-user]");if(!b)return;const status=b.dataset.status==="suspended"?"active":"suspended";const {error}=await sb.from("profiles").update({status}).eq("user_id",b.dataset.user);if(error)say(error.message,true);else{say("Player status updated.");load()}});
$("#adminComments").addEventListener("click",async e=>{const b=e.target.closest("[data-comment]");if(!b||!confirm("Remove this comment?"))return;const {error}=await sb.from("comments").delete().eq("id",b.dataset.comment);if(error)say(error.message,true);else{say("Comment removed.");load()}});
const nav=$(".admin-reference-nav .nav-right");if(nav){const b=document.createElement("button");b.className="solid-pill";b.textContent="Sign out";b.addEventListener("click",async()=>{await sb.auth.signOut();location.href="../login.html"});nav.appendChild(b)}
await load();
})();