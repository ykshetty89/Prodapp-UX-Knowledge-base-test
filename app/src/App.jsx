import { useState, useRef, useEffect } from "react";

const REPO   = "ykshetty89/Prodapp-UX-Knowledge-base-test";
const BRANCH = "main";
// PAT loaded from environment variable VITE_GITHUB_PAT
const PAT = import.meta.env.VITE_GITHUB_PAT || "";

const DOMAIN_FILES = {
  "Hub operations": "hub-operations.md",
  "Sorting":        "sorting.md",
  "Pickup":         "pickup.md",
  "Loading":        "loading.md",
  "Delivery":       "delivery.md",
  "Dispatcher":     "dispatcher.md",
  "Warehouse":      "warehouse.md",
  "Driver":         "driver.md",
  "Tracking":       "tracking.md",
};

const DOMAIN_COLORS = {
  "Hub operations": { bg:"#E8F0EB", text:"#2D5A3D", dot:"#4A8C5C" },
  "Sorting":        { bg:"#EEF2FB", text:"#2A3F8F", dot:"#4A6ACF" },
  "Pickup":         { bg:"#FDF3E3", text:"#A0620A", dot:"#D4880F" },
  "Loading":        { bg:"#F0EEFF", text:"#5B47C2", dot:"#7B61FF" },
  "Delivery":       { bg:"#FAF0EE", text:"#8C3A2A", dot:"#C25A44" },
  "Dispatcher":     { bg:"#EBF2FA", text:"#1A3A5C", dot:"#2E6BAD" },
  "Warehouse":      { bg:"#F5F0E8", text:"#6B4E1A", dot:"#A87B30" },
  "Driver":         { bg:"#FDE8F0", text:"#8C1A4A", dot:"#C23A70" },
  "Tracking":       { bg:"#E8F5F5", text:"#1A5C5C", dot:"#2EA8A8" },
};

// ── GitHub helpers ─────────────────────────────────────────────────────────
const GH_HEADERS = {
  "Authorization": `token ${PAT}`,
  "Accept": "application/vnd.github.v3+json",
  "Content-Type": "application/json",
};

function b64decode(str) {
  // Proper UTF-8 decode — handles em dashes, special chars that break atob()
  const binary = atob(str.replace(/\n/g, ""));
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder("utf-8").decode(bytes);
}

function b64encode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary  = "";
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary);
}

async function ghReadRaw(file) {
  // Public raw URL — no auth, no CORS issues, fast
  const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${file}?t=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Raw fetch failed: ${res.status}`);
  return res.text();
}

async function ghGetFile(file) {
  // For writes: needs the sha via API. For reads only: use ghReadRaw instead.
  const url = `https://api.github.com/repos/${REPO}/contents/${file}`;
  const res = await fetch(url, { headers: GH_HEADERS });
  if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);
  const data = await res.json();
  return { content: b64decode(data.content), sha: data.sha };
}

async function ghPutFile(file, content, sha, message) {
  const url = `https://api.github.com/repos/${REPO}/contents/${file}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: GH_HEADERS,
    body: JSON.stringify({ message, content: b64encode(content), sha, branch: BRANCH }),
  });
  return res.ok;
}

async function ghReadAll() {
  const results = {};
  await Promise.all(
    Object.entries(DOMAIN_FILES).map(async ([domain, file]) => {
      try {
        results[domain] = await ghReadRaw(file);
      } catch(e) {
        console.error("Failed to load", file, e);
        results[domain] = "";
      }
    })
  );
  return results;
}

async function ghAppendEntry(domain, entryMd) {
  const file = DOMAIN_FILES[domain];
  if (!file) return false;
  const { content, sha } = await ghGetFile(file);
  const updated = content.trimEnd() + "\n\n" + entryMd + "\n\n---\n";
  return ghPutFile(file, updated, sha, `KB: add entry to ${domain}`);
}

// ── Parser — tested against actual GitHub markdown format ──────────────────
function parseEntries(md) {
  // Split on ### headings — handles em dashes and special chars in titles
  const blocks = md.split(/\n(?=### )/).filter(b => b.trim().startsWith("### "));
  return blocks.map(b => {
    const titleM = b.match(/^### (.+)/m);
    const dateM  = b.match(/\*\*Date:\*\*\s*(.+)/);
    const authM  = b.match(/\*\*Author:\*\*\s*(.+)/);
    const srcM   = b.match(/\*\*Source:\*\*\s*(.+)/);
    const tagM   = b.match(/\*\*Tags:\*\*\s*(.+)/);
    // Body: everything after Tags line, strip trailing ---
    let body = "";
    const tagIdx = b.indexOf("**Tags:**");
    if (tagIdx !== -1) {
      body = b.slice(tagIdx).split("\n").slice(1).join("\n")
               .replace(/\n?---+\s*$/m, "").trim();
    }
    const tags = tagM
      ? tagM[1].trim().split(/\s+/).map(t => t.replace(/^#/, "")).filter(Boolean)
      : [];
    return {
      title:  titleM ? titleM[1].trim() : "Untitled",
      date:   dateM  ? dateM[1].trim()  : "",
      author: authM  ? authM[1].trim()  : "",
      source: srcM   ? srcM[1].trim()   : "",
      tags, body,
    };
  });
}

function formatEntry(e) {
  return `### ${e.title}
- **Date:** ${e.date}
- **Author:** ${e.author}
- **Source:** ${e.source}
- **Tags:** ${e.tags.map(t => "#" + t).join(" ")}

${e.insight}`;
}

async function callClaude(messages, system) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system, messages }),
  });
  const d = await res.json();
  return d.content?.find(b => b.type === "text")?.text || "";
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView]           = useState("browse");
  const [kbData, setKbData]       = useState({});
  const [kbLoading, setKbLoading] = useState(true);
  const [kbError, setKbError]     = useState(null);
  const [messages, setMessages]   = useState([{
    role: "assistant",
    content: "Hi! I'm connected to your GitHub KB. Share logistics research naturally — I'll detect insights and save them directly to the repo. Or ask me anything and I'll answer from the KB.",
  }]);
  const [input, setInput]         = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [pendingEntry, setPending]    = useState(null);
  const [saving, setSaving]           = useState(false);
  const [filterDomain, setFilter]     = useState("All");
  const [search, setSearch]           = useState("");
  const [debugLog, setDebugLog]       = useState([]);
  const [showDebug, setShowDebug]     = useState(true);
  const bottomRef = useRef();
  const inputRef  = useRef();

  // Load KB on mount
  useEffect(() => { loadKB(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, chatLoading]);

  async function loadKB() {
    setKbLoading(true);
    setKbError(null);
    const debug = [];
    const data = {};
    for (const [domain, file] of Object.entries(DOMAIN_FILES)) {
      try {
        const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${file}?t=${Date.now()}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          debug.push(`${file}: HTTP ${res.status}`);
          data[domain] = "";
          continue;
        }
        const text = await res.text();
        const blocks = text.split(/\n(?=### )/).filter(b => b.trim().startsWith("### "));
        debug.push(`${file}: ${text.length} chars, ${blocks.length} entries`);
        data[domain] = text;
      } catch(e) {
        debug.push(`${file}: ERROR ${e.message}`);
        data[domain] = "";
      }
    }
    setKbData(data);
    setDebugLog(debug);
    setKbLoading(false);
  }

  // Counts
  const domainCounts = {};
  Object.entries(kbData).forEach(([domain, content]) => {
    domainCounts[domain] = parseEntries(content).length;
  });
  const totalEntries = Object.values(domainCounts).reduce((a,b)=>a+b,0);

  async function confirmSave(entry) {
    setSaving(true);
    try {
      const ok = await ghAppendEntry(entry.domain, formatEntry(entry));
      if (ok) {
        await loadKB();
        setMessages(m => [...m, {
          role:"assistant",
          content:`✅ Saved to **${entry.domain}** in GitHub.\n\n**${entry.title}**\n\n${entry.insight}`,
        }]);
      } else {
        setMessages(m => [...m, { role:"assistant", content:"⚠️ Could not write to GitHub. Please try again." }]);
      }
    } catch(e) {
      setMessages(m => [...m, { role:"assistant", content:"⚠️ GitHub write failed: " + e.message }]);
    }
    setSaving(false);
    setPending(null);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || chatLoading) return;
    setInput("");

    // Handle save confirmation
    if (pendingEntry) {
      if (["yes","save","y"].includes(text.toLowerCase())) {
        setMessages(m => [...m, { role:"user", content:text }]);
        await confirmSave(pendingEntry);
        return;
      }
      if (["no","skip","n"].includes(text.toLowerCase())) {
        setPending(null);
        setMessages(m => [...m, { role:"user", content:text }, { role:"assistant", content:"Skipped." }]);
        return;
      }
    }

    setMessages(m => [...m, { role:"user", content:text }]);
    setChatLoading(true);

    try {
      // Build KB context from live data
      const kbContext = Object.entries(kbData)
        .map(([domain, content]) => {
          const entries = parseEntries(content);
          if (!entries.length) return null;
          return `## ${domain} (${entries.length} entries)\n` +
            entries.map(e => `- ${e.title}: ${e.body.slice(0,150)}`).join("\n");
        })
        .filter(Boolean).join("\n\n");

      const today = new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});

      const system = `You are the UX research assistant for the Prodapp logistics design team.

KNOWLEDGE BASE (${totalEntries} entries from GitHub):
${kbContext || "No entries yet."}

RULES:
- When answering questions: use only the KB above. Cite domain names.
- When capturing research: synthesise ONLY from what the user provides. No assumptions. No padding.
- Only capture logistics domain knowledge. Ignore non-logistics topics.
- Domains: Hub operations, Sorting, Pickup, Loading, Delivery, Dispatcher, Warehouse, Driver, Tracking.
- If content doesn't fit any domain, ask user to confirm a new domain name first.

If the user shares valuable logistics research, after your response append:

KNOWLEDGE_CAPTURE:
{"title":"title from user words","domain":"exact domain","insight":"2-3 sentences from user input only","tags":["tag1","tag2"],"source":"chat","date":"${today}","author":"Team member"}

Do NOT append KNOWLEDGE_CAPTURE for questions, greetings, or non-logistics content.`;

      const history = messages.slice(-8)
        .filter(m => m.content)
        .map(m => ({ role:m.role, content:m.content }));

      const response = await callClaude([...history, { role:"user", content:text }], system);

      const match = response.match(/KNOWLEDGE_CAPTURE:\s*(\{[\s\S]*?\})\s*$/);
      if (match) {
        try {
          const captured = JSON.parse(match[1]);
          const display  = response.replace(/KNOWLEDGE_CAPTURE:[\s\S]*$/, "").trim();
          setPending(captured);
          setMessages(m => [...m,
            { role:"assistant", content:display },
            { role:"assistant", content:null, capture:captured },
          ]);
        } catch(e) {
          setMessages(m => [...m, { role:"assistant", content:response }]);
        }
      } else {
        setMessages(m => [...m, { role:"assistant", content:response }]);
      }
    } catch(e) {
      setMessages(m => [...m, { role:"assistant", content:"Connection issue. Please try again." }]);
    }

    setChatLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  // Filtered entries for browse
  const filteredDomains = Object.entries(kbData).map(([domain, content]) => {
    let entries = parseEntries(content);
    if (filterDomain !== "All" && domain !== filterDomain) return null;
    if (search) {
      const q = search.toLowerCase();
      entries = entries.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.body.toLowerCase().includes(q)  ||
        e.tags.join(" ").toLowerCase().includes(q)
      );
    }
    return { domain, entries, color: DOMAIN_COLORS[domain] };
  }).filter(Boolean);

  return (
    <div style={S.root}>
      {/* ── Sidebar ── */}
      <aside style={S.sidebar}>
        <div style={S.sidebarHead}>
          <div style={S.logoRow}>
            <div style={S.logoMark}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L14 8L8 14M2 8H14" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={S.logoText}>Prodapp UX</div>
              <div style={S.logoSub}>knowledge base</div>
            </div>
          </div>
        </div>

        <nav style={S.nav}>
          <div style={S.navLabel}>Workspace</div>
          <SideBtn label="Browse KB"      icon="📚" active={view==="browse"} count={totalEntries} onClick={()=>setView("browse")}/>
          <SideBtn label="Research chat"  icon="💬" active={view==="chat"}   onClick={()=>setView("chat")}/>

          <div style={{...S.navLabel, marginTop:18}}>Domains</div>
          <SideBtn label="All domains" icon="·" active={filterDomain==="All"&&view==="browse"}
            onClick={()=>{setFilter("All");setView("browse");}}/>
          {Object.entries(DOMAIN_COLORS).map(([d,col])=>(
            <SideBtn key={d} label={d} dot={col.dot}
              count={domainCounts[d]||0}
              active={filterDomain===d&&view==="browse"}
              onClick={()=>{setFilter(d);setView("browse");}}/>
          ))}
        </nav>

        <div style={S.sidebarFoot}>
          <div style={S.ghStatus}>
            <span style={{...S.statusDot, background: kbError?"#C25A44":"#4A8C5C"}}/>
            {kbError ? "GitHub error" : `${totalEntries} entries synced`}
          </div>
          <a href={`https://github.com/${REPO}`} target="_blank" rel="noreferrer" style={S.ghLink}>
            ↗ View on GitHub
          </a>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={S.main}>

        {/* BROWSE */}
        {view==="browse" && (
          <div style={S.pane}>
            <div style={S.topbar}>
              <div>
                <div style={S.pageTitle}>{filterDomain==="All"?"All entries":filterDomain}</div>
                <div style={S.pageSub}>
                  {kbLoading ? "Loading from GitHub…" :
                   kbError   ? kbError :
                   `${totalEntries} entries across ${Object.keys(DOMAIN_FILES).length} domains`}
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                {filterDomain!=="All" && (
                  <button style={S.btnGhost} onClick={()=>setFilter("All")}>All domains ×</button>
                )}
                <button style={S.btnGhost} onClick={loadKB} disabled={kbLoading}>
                  {kbLoading?"…":"↻ Refresh"}
                </button>
                <button style={S.btnPrimary} onClick={()=>setView("chat")}>+ Add via chat</button>
              </div>
            </div>

            {showDebug && debugLog.length > 0 && (
              <div style={{padding:"10px 22px",background:"#FFF8E1",borderBottom:"1px solid #E8E6DF",fontFamily:"monospace",fontSize:11,color:"#6B5500"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <strong>🔍 Debug — what loaded from GitHub:</strong>
                  <button onClick={()=>setShowDebug(false)} style={{background:"transparent",border:"none",cursor:"pointer",color:"#6B5500",fontSize:14}}>×</button>
                </div>
                {debugLog.map((l,i)=><div key={i}>· {l}</div>)}
              </div>
            )}

            <div style={S.searchRow}>
              <input style={S.searchInput} placeholder="Search entries, tags, insights…"
                value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>

            <div style={S.scroll}>
              {kbLoading ? (
                <div style={S.empty}><Dots/><span style={{marginLeft:10,color:"#9E9A8E"}}>Loading from GitHub…</span></div>
              ) : kbError ? (
                <div style={S.empty}>{kbError}</div>
              ) : filteredDomains.every(d=>d.entries.length===0) ? (
                <div style={S.empty}>No entries found.</div>
              ) : (
                filteredDomains.map(({domain, entries, color}) => {
                  if (!entries.length) return null;
                  return (
                    <div key={domain} style={S.domainBlock}>
                      <div style={S.domainHead}>
                        <span style={{...S.dot8, background:color.dot}}/>
                        <span style={S.domainName}>{domain}</span>
                        <span style={S.domainCount}>{entries.length} {entries.length===1?"entry":"entries"}</span>
                        <a href={`https://github.com/${REPO}/blob/main/${DOMAIN_FILES[domain]}`}
                          target="_blank" rel="noreferrer" style={S.ghLinkSm}>↗ GitHub</a>
                      </div>
                      {entries.map((e,i)=>(
                        <div key={i} style={{...S.entryCard, borderBottom: i<entries.length-1?"1px solid #F0EDE6":"none"}}>
                          <div style={S.entryTitle}>{e.title}</div>
                          <div style={S.entryMeta}>
                            <span style={{...S.pill, background:color.bg, color:color.text}}>{domain}</span>
                            {e.date   && <span style={S.metaTxt}>{e.date}</span>}
                            {e.author && <span style={S.metaTxt}>{e.author}</span>}
                            {e.source && <span style={S.metaTxt}>{e.source}</span>}
                          </div>
                          {e.body && <div style={S.entryBody}>{e.body}</div>}
                          {e.tags.length>0 && (
                            <div style={S.tagRow}>
                              {e.tags.map(t=><span key={t} style={S.tag}>#{t}</span>)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* CHAT */}
        {view==="chat" && (
          <div style={S.pane}>
            <div style={S.topbar}>
              <div>
                <div style={S.pageTitle}>Research chat</div>
                <div style={S.pageSub}>Insights saved directly to GitHub · {totalEntries} entries loaded</div>
              </div>
              <div style={S.ghBadge}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                Connected
              </div>
            </div>

            <div style={S.msgs}>
              {messages.map((m,i)=>(
                <div key={i}>
                  {m.capture ? (
                    <CaptureCard entry={m.capture} saving={saving}
                      onYes={()=>confirmSave(m.capture)}
                      onNo={()=>{setPending(null);setMessages(ms=>ms.map((msg,idx)=>idx===i?{...msg,capture:null,skipped:true}:msg));}}/>
                  ) : m.skipped ? (
                    <div style={S.skipped}>Skipped — not saved</div>
                  ) : m.content ? (
                    <Bubble msg={m}/>
                  ) : null}
                </div>
              ))}
              {chatLoading && (
                <div style={S.assistRow}>
                  <div style={S.aiBadge}>Claude</div>
                  <div style={{...S.bubble, background:"#FAFAF8", border:"1px solid #E8E6DF"}}><Dots/></div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            <div style={S.inputRow}>
              <textarea ref={inputRef} style={S.ta} value={input} rows={3}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}}
                placeholder="Share research notes or ask a question about the KB…"/>
              <button style={{...S.btnPrimary, opacity:chatLoading||!input.trim()?0.5:1, padding:"10px 18px"}}
                onClick={sendMessage} disabled={chatLoading||!input.trim()}>Send</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────
function SideBtn({label,icon,dot,active,onClick,count}){
  return(
    <button onClick={onClick} style={{...S.navItem,
      background:active?"#E8F0EB":"transparent",
      color:active?"#2D5A3D":"#6B6658",fontWeight:active?500:400}}>
      {dot
        ? <span style={{width:8,height:8,borderRadius:"50%",background:dot,flexShrink:0,display:"inline-block"}}/>
        : <span style={{fontSize:12,flexShrink:0}}>{icon}</span>}
      <span style={{flex:1,textAlign:"left",fontSize:12}}>{label}</span>
      {count!==undefined&&count>0&&
        <span style={{...S.navCount,background:active?"#2D5A3D":"#E8E6DF",color:active?"#fff":"#9E9A8E"}}>{count}</span>}
    </button>
  );
}

function Bubble({msg}){
  const isUser=msg.role==="user";
  return(
    <div style={isUser?S.userRow:S.assistRow}>
      {!isUser&&<div style={S.aiBadge}>Claude</div>}
      <div style={{...S.bubble,
        background:isUser?"#2D5A3D":"#FAFAF8",
        color:isUser?"#fff":"#1C1A15",
        border:isUser?"none":"1px solid #E8E6DF",
        alignSelf:isUser?"flex-end":"flex-start"}}>
        <RichText text={msg.content}/>
      </div>
    </div>
  );
}

function RichText({text}){
  if(!text)return null;
  return(
    <span style={{fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap"}}>
      {text.split(/(\*\*[^*]+\*\*)/).map((p,i)=>
        p.startsWith("**")&&p.endsWith("**")
          ?<strong key={i}>{p.slice(2,-2)}</strong>
          :<span key={i}>{p}</span>
      )}
    </span>
  );
}

function CaptureCard({entry,onYes,onNo,saving}){
  const col=DOMAIN_COLORS[entry.domain]||{bg:"#E8E6DF",text:"#1C1A15",dot:"#9E9A8E"};
  return(
    <div style={S.captureCard}>
      <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
        <span style={{fontSize:18,flexShrink:0}}>💡</span>
        <div>
          <div style={{fontSize:13,fontWeight:500,color:"#1C1A15"}}>Research worth saving to the team KB</div>
          <div style={{fontSize:11,color:"#9E9A8E",marginTop:1}}>Will be written directly to GitHub</div>
        </div>
      </div>
      <div style={{...S.pill,background:col.bg,color:col.text,display:"inline-flex",alignItems:"center",gap:5,marginTop:2}}>
        <span style={{width:6,height:6,borderRadius:"50%",background:col.dot,display:"inline-block"}}/>
        {entry.domain}
      </div>
      <div style={{fontSize:13,fontWeight:500,color:"#1C1A15"}}>{entry.title}</div>
      <div style={{fontSize:13,color:"#3A3830",lineHeight:1.65}}>{entry.insight}</div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
        {entry.tags.map(t=><span key={t} style={S.tag}>#{t}</span>)}
      </div>
      <div style={{display:"flex",gap:8,paddingTop:4}}>
        <button style={{...S.btnPrimary,opacity:saving?0.6:1,fontSize:12,padding:"7px 14px"}}
          onClick={onYes} disabled={saving}>
          {saving?"Saving to GitHub…":"✓ Save to GitHub KB"}
        </button>
        <button style={{...S.btnGhost,fontSize:12,padding:"7px 12px"}} onClick={onNo} disabled={saving}>Skip</button>
      </div>
    </div>
  );
}

function Dots(){
  return(
    <div style={{display:"flex",gap:4,alignItems:"center"}}>
      {[0,1,2].map(i=>(
        <div key={i} style={{width:5,height:5,borderRadius:"50%",background:"#9E9A8E",
          animation:`kb-dot 1.2s ease-in-out ${i*0.2}s infinite`}}/>
      ))}
      <style>{`@keyframes kb-dot{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const S={
  root:{display:"flex",height:"100vh",fontFamily:"'DM Sans',system-ui,sans-serif",background:"#F4F2ED",fontSize:14,overflow:"hidden"},
  sidebar:{width:230,background:"#FAFAF8",borderRight:"1px solid #E8E6DF",display:"flex",flexDirection:"column",flexShrink:0},
  sidebarHead:{padding:"18px 14px 14px",borderBottom:"1px solid #E8E6DF"},
  logoRow:{display:"flex",alignItems:"center",gap:9},
  logoMark:{width:26,height:26,background:"#2D5A3D",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
  logoText:{fontSize:13,fontWeight:500,color:"#1C1A15"},
  logoSub:{fontSize:10,color:"#9E9A8E",fontFamily:"monospace"},
  nav:{flex:1,padding:"10px 8px",overflowY:"auto"},
  navLabel:{fontSize:10,fontWeight:500,letterSpacing:".07em",textTransform:"uppercase",color:"#9E9A8E",padding:"0 8px",marginBottom:4},
  navItem:{display:"flex",alignItems:"center",gap:7,padding:"5px 8px",borderRadius:8,cursor:"pointer",border:"none",width:"100%",transition:"all 0.15s",fontFamily:"inherit"},
  navCount:{fontSize:10,fontFamily:"monospace",padding:"1px 6px",borderRadius:20},
  sidebarFoot:{padding:"12px 14px",borderTop:"1px solid #E8E6DF"},
  ghStatus:{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#6B6658",fontFamily:"monospace",marginBottom:6},
  statusDot:{width:6,height:6,borderRadius:"50%",display:"inline-block"},
  ghLink:{fontSize:11,color:"#2D5A3D",textDecoration:"none",fontFamily:"monospace"},
  main:{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"},
  pane:{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"},
  topbar:{padding:"14px 22px",borderBottom:"1px solid #E8E6DF",background:"#FAFAF8",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0},
  pageTitle:{fontSize:15,fontWeight:500,color:"#1C1A15"},
  pageSub:{fontSize:11,color:"#9E9A8E",marginTop:2,fontFamily:"monospace"},
  ghBadge:{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#2D5A3D",background:"#E8F0EB",padding:"4px 10px",borderRadius:20,fontFamily:"monospace"},
  searchRow:{padding:"12px 22px",borderBottom:"1px solid #E8E6DF",flexShrink:0},
  searchInput:{width:"100%",fontFamily:"inherit",fontSize:13,padding:"8px 12px",border:"1px solid #E8E6DF",borderRadius:8,background:"#FAFAF8",color:"#1C1A15",outline:"none",boxSizing:"border-box"},
  scroll:{flex:1,overflowY:"auto",padding:"16px 22px",display:"flex",flexDirection:"column",gap:12},
  domainBlock:{background:"#FAFAF8",border:"1px solid #E8E6DF",borderRadius:12,overflow:"hidden"},
  domainHead:{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",background:"#F4F2ED",borderBottom:"1px solid #E8E6DF"},
  dot8:{width:8,height:8,borderRadius:"50%",display:"inline-block",flexShrink:0},
  domainName:{fontSize:13,fontWeight:500,color:"#1C1A15",flex:1},
  domainCount:{fontSize:11,color:"#9E9A8E",fontFamily:"monospace"},
  ghLinkSm:{fontSize:11,color:"#2D5A3D",textDecoration:"none",fontFamily:"monospace"},
  entryCard:{padding:"14px 16px"},
  entryTitle:{fontSize:13,fontWeight:500,color:"#1C1A15",marginBottom:6,lineHeight:1.4},
  entryMeta:{display:"flex",alignItems:"center",gap:7,marginBottom:8,flexWrap:"wrap"},
  metaTxt:{fontSize:11,color:"#9E9A8E",fontFamily:"monospace"},
  entryBody:{fontSize:13,color:"#3A3830",lineHeight:1.65,marginBottom:8},
  tagRow:{display:"flex",gap:5,flexWrap:"wrap"},
  tag:{fontSize:11,fontFamily:"monospace",padding:"2px 8px",borderRadius:20,background:"#F0EDE6",color:"#6B6658"},
  pill:{fontSize:11,fontWeight:500,padding:"2px 9px",borderRadius:20},
  msgs:{flex:1,overflowY:"auto",padding:"16px 22px",display:"flex",flexDirection:"column",gap:10},
  userRow:{display:"flex",justifyContent:"flex-end"},
  assistRow:{display:"flex",flexDirection:"column",gap:3},
  aiBadge:{fontSize:10,color:"#9E9A8E",fontFamily:"monospace",marginLeft:2},
  bubble:{maxWidth:"78%",padding:"10px 14px",borderRadius:12,lineHeight:1.7},
  inputRow:{padding:"14px 22px",borderTop:"1px solid #E8E6DF",background:"#FAFAF8",display:"flex",gap:10,alignItems:"flex-end",flexShrink:0},
  ta:{flex:1,fontFamily:"inherit",fontSize:13,padding:"9px 13px",border:"1px solid #E8E6DF",borderRadius:10,resize:"none",background:"#F4F2ED",color:"#1C1A15",outline:"none",lineHeight:1.6},
  captureCard:{background:"#fff",border:"1.5px solid #4A8C5C50",borderRadius:12,padding:"14px 16px",maxWidth:"86%",display:"flex",flexDirection:"column",gap:9},
  skipped:{fontSize:11,color:"#C0BCB0",fontStyle:"italic",padding:"2px 0"},
  empty:{display:"flex",alignItems:"center",justifyContent:"center",padding:"60px 0",fontSize:13,color:"#9E9A8E"},
  btnPrimary:{padding:"7px 14px",background:"#2D5A3D",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"},
  btnGhost:{padding:"7px 12px",background:"transparent",border:"1px solid #E8E6DF",borderRadius:8,fontSize:12,color:"#6B6658",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"},
};
