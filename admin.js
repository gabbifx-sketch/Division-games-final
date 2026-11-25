(async function(){
const $=s=>document.querySelector(s),body=$("#gameTable"),note=$("#adminNote");
const say=(m,bad)=>{if(note){note.textContent=m;note.classList.toggle("error",!!bad)}};
let sb;try{sb=await window.divisionSupabaseReady}catch(e){location.href="../login.html";return}
const {data:{user},error:ae}=await sb.auth.getUser();if(ae||!user){location.href="../login.html?next=admin";return}
const {data:role,error:re}=await sb.from("admin_roles").select("role").eq("user_id",user.id).maybeSingle();
if(re||!role||role.role!=="admin"){document.body.innerHTML='<main style="max-width:600px;margin:12vh auto;padding:24px;font:16px Arial"><h1>Admin access required</h1><p>This account does not have Division administrator permissions.</p><a href="../index.html">Return to Division</a></main>';return}
const {data:profile}=await sb.from("profiles").select("username").eq("user_id",user.id).maybeSingle();
const tag=$(".connected-tag");if(tag)tag.textContent="● Signed in as "+(profile&&profile.username||user.email);
function esc(s){return String(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
async function load(){
const res=await Promise.all([
sb.from("games").select("id,title,slug,thumbnail_url,is_published,is_featured,created_at,categories(name)").order("created_at",{ascending:false}),
sb.from("profiles").select("user_id,username,first_name,last_name,status,created_at").order("created_at",{ascending:false}).limit(10),
sb.from("likes").select("user_id",{count:"exact",head:true}),
sb.from("comments").select("id,body,created_at,profiles(username),games(title)").order("created_at",{ascending:false}).limit(10),
sb.from("profiles").select("user_id",{count:"exact",head:true})
]);
const games=res[0].data||[],users=res[1].data||[],comments=res[3].data||[];
if(res[0].error){say(res[0].error.message,true);return}
const nums=[games.length,res[4].count||0,res[2].count||0,res[3].data?res[3].data.length:0],k=document.querySelectorAll(".admin-kpis article b");
nums.forEach((n,i)=>{if(k[i])k[i].textContent=n});
body.innerHTML=games.map(g=>'<tr><td><div style="display:flex;align-items:center;gap:9px">'+(g.thumbnail_url?'<img src="'+esc(g.thumbnail_url)+'" alt="" style="width:44px;height:34px;object-fit:cover;border-radius:7px">':"")+'<b>'+esc(g.title)+'</b></div></td><td>'+esc(g.categories&&g.categories.name||"Uncategorised")+'</td><td>'+(g.is_featured?"Yes":"—")+'</td><td><span class="admin-status">'+(g.is_published?"Published":"Draft")+'</span></td><td><button class="table-action" data-publish="'+g.id+'" data-state="'+g.is_published+'">'+(g.is_published?"Unpublish":"Publish")+'</button> <button class="table-action" data-edit="'+g.id+'">Edit</button> <button class="table-action" data-delete="'+g.id+'">Delete</button></td></tr>').join("")||'<tr><td colspan="5">No games yet. Add your first game.</td></tr>';
$("#adminUsers").innerHTML=users.map(u=>'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid #e7eee9"><span><b>'+esc(u.username||"Player")+'</b><small style="display:block;color:#77839a">'+esc(((u.first_name||"")+" "+(u.last_name||"")).trim())+'</small></span><button class="table-action" data-user="'+u.user_id+'" data-status="'+u.status+'">'+(u.status==="suspended"?"Reactivate":"Suspend")+'</button></div>').join("")||"<p>No players registered.</p>";
$("#adminComments").innerHTML=comments.map(c=>'<div style="padding:9px 0;border-bottom:1px solid #e7eee9"><b>'+esc(c.profiles&&c.profiles.username||"Player")+'</b><small style="color:#77839a"> · '+esc(c.games&&c.games.title||"Game")+'</small><p style="margin:5px 0;font-size:12px">'+esc(c.body)+'</p><button class="table-action" data-comment="'+c.id+'">Remove comment</button></div>').join("")||"<p>No comments yet.</p>";
}
async function editGame(old){
const title=prompt("Game title:",old?old.title:"");if(!title||!title.trim())return;
const category=prompt("Category name:",old&&old.categories?old.categories.name:"Arcade")||"Arcade";
const image=prompt("Cover image URL:",old&&old.thumbnail_url||"")||"";
const url=prompt("Playable game URL (optional):",old&&old.embed_url||"")||null;
const slug=title.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
let {data:cat}=await sb.from("categories").select("id").ilike("name",category.trim()).maybeSingle();
if(!cat){const cr=await sb.from("categories").insert({name:category.trim(),slug:category.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-")}).select("id").single();if(cr.error){say(cr.error.message,true);return}cat=cr.data}
const publish=old?!!old.is_published:confirm("Publish this game now? Choose Cancel to save it as a draft.");
const payload={title:title.trim(),slug,category_id:cat.id,thumbnail_url:image||null,embed_url:url,is_published:publish,is_featured:old&&old.is_featured||false};
const result=old?await sb.from("games").update(payload).eq("id",old.id):await sb.from("games").insert(payload);
if(result.error){say(result.error.message,true);return}say(old?"Game updated.":publish?"Game added and published.":"Game saved as a draft.");load();
}
$("#addGame")&&$("#addGame").addEventListener("click",()=>editGame(null));
$("#addGameTop")&&$("#addGameTop").addEventListener("click",()=>editGame(null));
body.addEventListener("click",async e=>{
const del=e.target.closest("[data-delete]"),edit=e.target.closest("[data-edit]"),pub=e.target.closest("[data-publish]");
if(pub){const {error}=await sb.from("games").update({is_published:pub.dataset.state!=="true"}).eq("id",pub.dataset.publish);if(error)say(error.message,true);else{say("Game visibility updated.");load()}}
if(del&&confirm("Delete this game permanently?")){const {error}=await sb.from("games").delete().eq("id",del.dataset.delete);if(error)say(error.message,true);else{say("Game deleted.");load()}}
if(edit){const {data,error}=await sb.from("games").select("*,categories(name)").eq("id",edit.dataset.edit).single();if(error)say(error.message,true);else editGame(data)}
});
$("#adminUsers").addEventListener("click",async e=>{const b=e.target.closest("[data-user]");if(!b)return;const status=b.dataset.status==="suspended"?"active":"suspended";const {error}=await sb.from("profiles").update({status}).eq("user_id",b.dataset.user);if(error)say(error.message,true);else{say("Player status updated.");load()}});
$("#adminComments").addEventListener("click",async e=>{const b=e.target.closest("[data-comment]");if(!b||!confirm("Remove this comment?"))return;const {error}=await sb.from("comments").delete().eq("id",b.dataset.comment);if(error)say(error.message,true);else{say("Comment removed.");load()}});
const nav=$(".admin-reference-nav .nav-right");if(nav){const b=document.createElement("button");b.className="solid-pill";b.textContent="Sign out";b.addEventListener("click",async()=>{await sb.auth.signOut();location.href="../login.html"});nav.appendChild(b)}
await load();
})();