/* content-ops: AI-assisted content operations for solo social media managers.
   Runs entirely in the browser. No build step, no server. */
"use strict";

const STORE_KEY = "contentops.v1";
const DAY_NAMES = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const PLATFORMS = {
  instagram: { label:"Instagram", times:["11:00","19:00"], tagCount:12, charLimit:2200 },
  linkedin:  { label:"LinkedIn",  times:["08:00","12:30"], tagCount:4,  charLimit:1300 },
  tiktok:    { label:"TikTok",    times:["15:00","21:00"], tagCount:5,  charLimit:150 },
  shorts:    { label:"YouTube Shorts", times:["13:00","18:00"], tagCount:4, charLimit:100 },
  x:         { label:"X / Twitter", times:["09:00","17:00"], tagCount:3, charLimit:280 }
};

const STOP = new Set(("a an the and or but if then than so of to in on for with at by from as is are was were be been being this that these those it its your you we our their they he she his her not no do does did done can could should would will won't about into over under more most some any all each very just also how why what when where which who whom while during before after again further once here there own same too only other such own".split(" ")));

const HOOK_TEMPLATES = [
  "The {topic} mistake almost everyone makes (and the 10-second fix)",
  "I tested {topic} for a week. Here is what actually worked.",
  "Stop scrolling: {topic} is easier than you think",
  "3 things nobody tells you about {topic}",
  "You are doing {topic} the hard way. Do this instead.",
  "{topic}, explained in under 60 seconds",
  "What changed for me once I got {topic} right",
  "Save this if {topic} is on your list this week"
];

const CAPTION_TEMPLATES = [
  "{topic} keeps coming up, so here is the short version.\n\n{point}\n\nTry it on your next post and tell me how it goes.",
  "Quick one on {topic}.\n\n{point}\n\nSave this for later.",
  "Most people overcomplicate {topic}. It comes down to one thing:\n\n{point}\n\nWhich side are you on?",
  "A small {topic} change that made my work noticeably better:\n\n{point}\n\nSteal it."
];

const CTA_BANK = [
  "Save this for your next content sprint.",
  "Which one are you trying first? Tell me in the comments.",
  "Share this with someone who manages content alone.",
  "Follow for more practical content ops.",
  "Comment TOOLS and I will send my checklist."
];

const NICHE_TAGS = ["#contentcreator","#socialmediatips","#contentstrategy","#creatoreconomy","#marketingtips","#digitalmarketing","#smallbusiness","#solopreneur","#contentmarketing","#videoediting","#canvatips","#buildinpublic"];

const POINTS = [
  "batch the work: one planning block beats five scattered edits",
  "write the hook first, the rest of the post follows from it",
  "repurpose one strong idea across every platform instead of inventing seven",
  "keep a running idea bank so you never post from a blank page",
  "post at the same two windows each day until the data tells you otherwise"
];

/* ---------- utilities ---------- */
function hashString(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function pick(arr,r){return arr[Math.floor(r()*arr.length)];}
function keywords(text,n){
  const freq={};
  text.toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).forEach(w=>{
    if(w.length>3 && !STOP.has(w)) freq[w]=(freq[w]||0)+1;
  });
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,n).map(e=>e[0]);
}
function topicSlug(topic){
  const ks=keywords(topic,4);
  return ks.length?ks.map(k=>"#"+k):["#contenttips"];
}
function esc(s){const d=document.createElement("div");d.textContent=s;return d.innerHTML;}
function fmtDate(iso){const d=new Date(iso+"T00:00:00");return d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});}
function localISO(d){const y=d.getFullYear();const m=String(d.getMonth()+1).padStart(2,"0");const day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`;}
function weekdayKey(iso){const d=new Date(iso+"T00:00:00");return (d.getDay()+6)%7;} // 0=Mon..6=Sun

/* ---------- state ---------- */
let _uid=Date.now()%100000; function uid(){return "c"+(_uid++).toString(36)+Math.floor(Math.random()*1e4).toString(36);}
let state = loadState();
function loadState(){
  try{const raw=localStorage.getItem(STORE_KEY);if(raw)return JSON.parse(raw);}catch(e){}
  return {cards:sampleCards(),plan:null,ai:{base:"",key:"",model:""}};
}
function saveState(){try{localStorage.setItem(STORE_KEY,JSON.stringify(state));}catch(e){}}
function sampleCards(){
  return [
    {id:uid(),title:"Canva shortcut reel: resize in 2 taps",platform:"instagram",status:"idea",notes:"screen record it",date:""},
    {id:uid(),title:"Post: why applies get skipped (resume mismatch)",platform:"linkedin",status:"drafting",notes:"from job-hunt research",date:""},
    {id:uid(),title:"Short: one formula, three hooks",platform:"shorts",status:"ready",notes:"",date:""}
  ];
}

/* ---------- planner ---------- */
function generatePlan(topic,platforms,startDate){
  if(!platforms.length)platforms=["instagram","linkedin"];
  const r=rng(hashString(topic+startDate));
  const base=new Date(startDate+"T00:00:00");
  const tags=topicSlug(topic).concat(NICHE_TAGS).slice(0,14);
  const days=[];
  for(let i=0;i<7;i++){
    const pf=PLATFORMS[platforms[i%platforms.length]];
    const d=new Date(base);d.setDate(d.getDate()+i);
    const iso=d.toISOString().slice(0,10);
    const point=pick(POINTS,r);
    const hook=pick(HOOK_TEMPLATES,r).replace(/\{topic\}/g,topic);
    let cap=pick(CAPTION_TEMPLATES,r).replace(/\{topic\}/g,topic).replace(/\{point\}/g,point);
    // short-form platforms have tight caption limits, so they carry the hook instead of a full caption
    if(cap.length>pf.charLimit)cap=hook.length<=pf.charLimit?hook:hook.slice(0,pf.charLimit-3).trimEnd()+"...";
    const caption=cap;
    const hashtags=shuffle(tags,r).slice(0,pf.tagCount);
    const time=pick(pf.times,r);
    days.push({date:iso,platform:pf.label,pfKey:platforms[i%platforms.length],hook,caption,hashtags,time,cta:pick(CTA_BANK,r),limit:pf.charLimit});
  }
  return {topic,startDate,days,createdAt:new Date().toISOString()};
}
function shuffle(arr,r){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function aiAvailable(){return !!(state.ai.key && state.ai.base);}
async function aiPolish(entry){
  const prompt=`Rewrite this social caption for ${entry.platform}. Keep it under ${entry.limit} characters, punchy, one line break max. Return only the caption.\n\nTopic: ${entry.topic}\n\nCaption:\n${entry.caption}`;
  const res=await fetch(state.ai.base.replace(/\/$/,"")+"/chat/completions",{
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":"Bearer "+state.ai.key},
    body:JSON.stringify({model:state.ai.model||"gpt-4o-mini",messages:[{role:"user",content:prompt}],max_tokens:300})
  });
  if(!res.ok)throw new Error("API returned "+res.status);
  const data=await res.json();
  const text=data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content;
  if(!text)throw new Error("empty response");
  return text.trim();
}

/* ---------- repurposer ---------- */
function generateScripts(text){
  const sentences=text.replace(/\s+/g," ").match(/[^.!?]+[.!?]+/g)||[];
  if(!sentences.length)return null;
  const hook=sentences[0].trim();
  const sorted=sentences.slice(1).map(s=>s.trim()).sort((a,b)=>b.length-a.length);
  const beats=[sorted[0],sorted[1],sorted[2]].filter(Boolean);
  const scripts=[1,2,3].map(n=>({
    title:`Short script ${n}`,
    hook: n===1?hook:pick(HOOK_TEMPLATES,rng(hashString(text+n))).replace(/\{topic\}/g,keywords(text,3).join(" ")||"this"),
    beats,
    cta:pick(CTA_BANK,rng(hashString(text+"cta"+n)))
  }));
  const slides=sentences.slice(0,5).map((s,i)=>({n:i+1,text:s.trim().slice(0,120)}));
  while(slides.length<5)slides.push({n:slides.length+1,text:"(your closing point)"});
  return {scripts,slides};
}

/* ---------- rendering ---------- */
function switchView(name){
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.view===name));
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id==="view-"+name));
  const activeTab=document.querySelector(`.tab[data-view="${name}"]`);
  if(activeTab)activeTab.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"});
  if(name==="board")renderBoard();
  if(name==="calendar")renderCalendar();
}

function renderBoard(){
  const board=document.getElementById("board");
  const cols=[["idea","Ideas"],["drafting","Drafting"],["ready","Ready to post"],["posted","Posted"]];
  board.innerHTML=cols.map(([key,label])=>{
    const cards=state.cards.filter(c=>c.status===key);
    return `<div class="col"><h3>${label}<span class="count">${cards.length}</span></h3>`+
      (cards.length?cards.map(cardHTML).join(""):`<div class="col-empty">Nothing here yet</div>`)+`</div>`;
  }).join("");
  board.querySelectorAll("select[data-id]").forEach(sel=>sel.addEventListener("change",()=>{
    const card=state.cards.find(c=>c.id===sel.dataset.id);
    if(card){card.status=sel.value;saveState();renderBoard();}
  }));
  board.querySelectorAll(".del").forEach(btn=>btn.addEventListener("click",()=>{
    state.cards=state.cards.filter(c=>c.id!==btn.dataset.id);saveState();renderBoard();
  }));
}
function cardHTML(c){
  const options=Object.entries({idea:"Idea",drafting:"Drafting",ready:"Ready to post",posted:"Posted"})
    .map(([k,v])=>`<option value="${k}" ${c.status===k?"selected":""}>${v}</option>`).join("");
  const pf=PLATFORMS[c.platform]?PLATFORMS[c.platform].label:c.platform;
  return `<div class="kcard">
    <div class="kcard-top"><span class="pf-chip">${esc(pf)}</span><button class="del" data-id="${c.id}" title="Delete card" aria-label="Delete card">×</button></div>
    <div class="t">${esc(c.title)}</div>
    ${c.notes?`<div class="kcard-notes">${esc(c.notes)}</div>`:""}
    <div class="kcard-status"><select data-id="${c.id}" aria-label="Move ${esc(c.title)} to another stage">${options}</select></div>
  </div>`;
}

function renderPlan(){
  const out=document.getElementById("plan-output");
  if(!state.plan){out.innerHTML="";return;}
  const p=state.plan;
  out.innerHTML=`<div class="row-between plan-head"><strong>Week of ${fmtDate(p.startDate)}</strong><span class="pill">topic: ${esc(p.topic)}</span></div>`+
    p.days.map((e,i)=>`
      <div class="plan-day" data-i="${i}">
        <div class="head"><span class="d">${fmtDate(e.date)}</span><span class="pill">${e.platform} · post at ${e.time}</span></div>
        <div class="hookline">${esc(e.hook)}</div>
        <div class="caption">${esc(e.caption)}</div>
        <div class="tagline">${e.hashtags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
        <div class="foot"><span class="cta-text">${esc(e.cta)}</span>
          <button class="btn ai-btn" data-i="${i}" ${aiAvailable()?"":"disabled title=\"Add an API key in Export & AI first\""}>Rewrite with AI</button>
          <button class="btn copy-btn" data-i="${i}">Copy caption</button></div>
        <p class="note ai-note" data-i="${i}"></p>
      </div>`).join("");
  out.querySelectorAll(".copy-btn").forEach(b=>b.addEventListener("click",()=>{
    const e=state.plan.days[+b.dataset.i];
    navigator.clipboard.writeText(e.caption+" "+e.hashtags.join(" ")).then(()=>{b.textContent="Copied";setTimeout(()=>b.textContent="Copy caption",1200);});
  }));
  out.querySelectorAll(".ai-btn").forEach(b=>b.addEventListener("click",async()=>{
    const i=+b.dataset.i, note=out.querySelector(`.ai-note[data-i="${i}"]`);
    b.disabled=true;b.textContent="Working…";
    try{const t=await aiPolish(state.plan.days[i]);state.plan.days[i].caption=t;saveState();
      out.querySelector(`.plan-day[data-i="${i}"] .caption`).textContent=t;note.textContent="";b.textContent="Rewritten";}
    catch(err){note.textContent="AI call failed: "+err.message;b.disabled=false;b.textContent="Rewrite with AI";}
  }));
}

function renderCalendar(){
  const grid=document.getElementById("week-grid");
  if(!state.plan){
    grid.innerHTML=`<div class="cal-empty">No plan yet.<button class="btn mini" id="cal-go-planner">Go to Planner</button></div>`;
    const go=document.getElementById("cal-go-planner");
    if(go)go.addEventListener("click",()=>switchView("planner"));
    return;
  }
  const todayISO=localISO(new Date());
  const byDay=[[],[],[],[],[],[],[]];
  state.plan.days.forEach(e=>{byDay[weekdayKey(e.date)].push(e);});
  grid.innerHTML=DAY_NAMES.map((d,idx)=>{
    const entries=byDay[idx];
    const firstDate=entries.length?entries[0].date:"";
    const isToday=firstDate===todayISO;
    const dateLabel=firstDate?new Date(firstDate+"T00:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric"}):"";
    return `<div class="day${isToday?" today":""}">
      <div class="day-label">
        <span class="day-name">${d}</span>
        ${dateLabel?`<span class="day-date">${dateLabel}</span>`:""}
        ${isToday?`<span class="today-flag">Today</span>`:""}
      </div>
      <div class="day-entries">
        ${entries.length?entries.map(e=>`<div class="entry"><span class="pf">${esc(e.platform)}</span><span class="tm">${e.time}</span><span class="entry-hook">${esc(e.hook)}</span></div>`).join(""):`<div class="empty-row">Nothing planned for this day yet</div>`}
      </div>
    </div>`;
  }).join("");
}

function renderRepurpose(result){
  const out=document.getElementById("repurpose-output");
  if(!result){out.innerHTML=`<div class="empty">Paste some text first.</div>`;return;}
  out.innerHTML=result.scripts.map(s=>`
    <div class="script"><h3>${esc(s.title)}</h3>
      <ul><li><strong>Hook:</strong> ${esc(s.hook)}</li>
      ${s.beats.map((b,i)=>`<li><strong>Beat ${i+1}:</strong> ${esc(b)}</li>`).join("")}
      <li><strong>CTA:</strong> ${esc(s.cta)}</li></ul>
      <p class="note">Read the hook in the first 2 seconds, one beat per cut.</p></div>`).join("")+
    `<div class="script"><h3>Carousel outline (5 slides)</h3>
      <ul>${result.slides.map(s=>`<li><strong>Slide ${s.n}:</strong> ${esc(s.text)}</li>`).join("")}</ul></div>`;
}

/* ---------- exports ---------- */
function planMarkdown(){
  if(!state.plan)return null;
  const p=state.plan;
  let md=`# Content calendar — week of ${p.startDate}\n\nTopic: ${p.topic}\n`;
  p.days.forEach(e=>{
    md+=`\n## ${e.date} — ${e.platform} (${e.time})\n`;
    md+=`Hook: ${e.hook}\n\n${e.caption}\n\n${e.hashtags.join(" ")}\n\nCTA: ${e.cta}\n`;
  });
  return md;
}
function download(filename,text){
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([text],{type:"text/plain"}));
  a.download=filename;a.click();URL.revokeObjectURL(a.href);
}

/* ---------- wiring ---------- */
document.getElementById("tabs").addEventListener("click",e=>{
  const t=e.target.closest(".tab");if(t)switchView(t.dataset.view);
});
document.getElementById("plan-form").addEventListener("submit",e=>{
  e.preventDefault();
  const topic=document.getElementById("topic").value.trim();
  const start=document.getElementById("week-start").value;
  const platforms=[...document.querySelectorAll(".platform-picker input:checked")].map(i=>i.value);
  if(!topic||!start)return;
  state.plan=generatePlan(topic,platforms,start);
  saveState();renderPlan();switchView("calendar");
});
document.getElementById("add-card").addEventListener("click",()=>{
  const title=prompt("Idea title:");if(!title)return;
  state.cards.push({id:uid(),title,platform:"instagram",status:"idea",notes:"",date:""});
  saveState();renderBoard();
});
document.getElementById("repurpose-btn").addEventListener("click",()=>{
  const text=document.getElementById("source-text").value.trim();
  renderRepurpose(text?generateScripts(text):null);
});
document.getElementById("export-json").addEventListener("click",()=>{
  download("content-ops-backup.json",JSON.stringify(state,null,2));
});
document.getElementById("import-json").addEventListener("change",e=>{
  const f=e.target.files[0];if(!f)return;
  const reader=new FileReader();
  reader.onload=()=>{try{state=JSON.parse(reader.result);saveState();renderBoard();alert("Backup restored.");}catch(err){alert("That file is not a valid content-ops backup.");}};
  reader.readAsText(f);
});
document.getElementById("clear-data").addEventListener("click",()=>{
  if(confirm("Delete all cards, plans and settings stored in this browser?")){localStorage.removeItem(STORE_KEY);state=loadState();saveState();renderBoard();renderPlan();}
});
document.getElementById("save-ai").addEventListener("click",()=>{
  state.ai={base:document.getElementById("ai-base").value.trim(),key:document.getElementById("ai-key").value.trim(),model:document.getElementById("ai-model").value.trim()};
  saveState();document.getElementById("ai-status").textContent=aiAvailable()?"Saved. AI rewrite is available in the Planner.":"Saved. Add a key to enable AI rewrite.";
});
document.getElementById("export-md").addEventListener("click",()=>{
  const md=planMarkdown();
  if(!md){alert("Generate a plan first.");return;}
  download("content-calendar.md",md);
});

/* ---------- init ---------- */
(function init(){
  const ws=document.getElementById("week-start");
  const today=new Date();const day=(today.getDay()+6)%7; // Monday start
  today.setDate(today.getDate()-day);
  ws.value=localISO(today);
  renderPlan();renderBoard();
})();
