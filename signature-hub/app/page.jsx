"use client";

import { useEffect, useMemo, useState } from "react";

const blankSigner = () => ({ name: "", email: "" });
const initialRows = ["Today", "Awaiting signatures", "Completed", "Drafts"];

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({ total: 0, awaiting: 0, completed: 0 });
  const [status, setStatus] = useState("Loading workspace…");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Today");
  const [showComposer, setShowComposer] = useState(false);
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [signers, setSigners] = useState([blankSigner()]);
  const [ordered, setOrdered] = useState(false);
  const [drive, setDrive] = useState({ ready: false });
  const [toast, setToast] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("signature-hub-key");
    if (stored) { setApiKey(stored); return; }
    fetch("/api/admin/access-key").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.apiKey) { sessionStorage.setItem("signature-hub-key", d.apiKey); setApiKey(d.apiKey); }
      else setStatus("Sign in with your Vercel account to open Signature Hub.");
    }).catch(() => setStatus("Connect to the protected Signature Hub deployment."));
  }, []);

  async function api(path, options = {}) {
    const response = await fetch(path, { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${apiKey}` } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }

  async function refresh() {
    if (!apiKey) return;
    setStatus("Refreshing SignWell status…");
    try {
      const [result, health] = await Promise.all([api("/api/documents"), fetch("/api/health").then(r => r.json())]);
      const docs = result.documents || [];
      setDocuments(docs);
      setStats({ total: docs.length, awaiting: docs.filter(d => ["Sent", "In progress", "Pending"].includes(d.status)).length, completed: docs.filter(d => d.status === "Completed").length });
      setDrive(health.drive || { ready: false });
      setStatus("Connected to SignWell · test mode");
      setError("");
    } catch (e) { setStatus("Connection needs attention"); setError(e.message); }
  }

  useEffect(() => { refresh(); }, [apiKey]);

  const filtered = useMemo(() => {
    if (activeFilter === "Today") return documents.filter(d => d.created_at && new Date(d.created_at).toDateString() === new Date().toDateString());
    if (activeFilter === "Awaiting signatures") return documents.filter(d => ["Sent", "In progress", "Pending"].includes(d.status));
    if (activeFilter === "Completed") return documents.filter(d => d.status === "Completed");
    if (activeFilter === "Drafts") return documents.filter(d => d.status === "Draft");
    return documents;
  }, [documents, activeFilter]);

  function updateSigner(i, key, value) { setSigners(rows => rows.map((r, n) => n === i ? { ...r, [key]: value } : r)); }
  function notify(message) { setToast(message); setTimeout(() => setToast(""), 3600); }

  async function createDraft(e) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      if (!file || file.type !== "application/pdf") throw new Error("Choose a PDF file to continue.");
      const form = new FormData();
      form.set("file", file); form.set("name", name || file.name.replace(/\.pdf$/i, ""));
      form.set("recipients", JSON.stringify(signers)); form.set("applySigningOrder", String(ordered));
      const result = await api("/api/documents", { method: "POST", body: form });
      setShowComposer(false); setFile(null); setName(""); setSigners([blankSigner()]);
      notify("Test draft created. No signer email was sent."); await refresh();
      if (result.document?.id) setActiveFilter("Drafts");
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function sendTest(id) {
    if (!confirm("Send a TEST MODE signature invitation? It is not legally binding, but SignWell may email the listed signers.")) return;
    setBusy(true);
    try { await api(`/api/documents/${id}/send`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reminders: true }) }); notify("Test-mode invitation sent."); await refresh(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function remind(id) {
    if (!confirm("Send a SignWell reminder to recipients who have not signed?")) return;
    setBusy(true);
    try { await api(`/api/documents/${id}/remind`, { method: "POST" }); notify("Reminder sent."); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  const time = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });
  return <main className="shell">
    <aside className="rail">
      <div className="brand"><span className="brand-mark">S</span><span>signature<span className="brand-light">hub</span></span></div>
      <div className="rail-label">WORKSPACE</div>
      <nav>{initialRows.map((item, i) => <button key={item} onClick={() => setActiveFilter(item)} className={`nav-item ${activeFilter === item ? "selected" : ""}`}><span className="nav-icon">{["◷", "◉", "✓", "▤"][i]}</span>{item}<span className="nav-count">{[stats.total, stats.awaiting, stats.completed, documents.filter(d=>d.status==="Draft").length][i]}</span></button>)}</nav>
      <div className="rail-bottom">
        <div className="rail-label">INTEGRATIONS</div>
        <div className="integration"><span className="dot green"/><div><b>SignWell</b><small>Test mode active</small></div><span className="pulse"/></div>
        <div className="integration"><span className={`dot ${drive.ready ? "green" : "amber"}`}/><div><b>Google Drive</b><small>{drive.ready ? "Archive enabled" : "Authorization needed"}</small></div></div>
        <a className="settings-link" href="#setup">⌘ &nbsp; API & setup</a>
        <div className="profile"><div className="avatar">GG</div><div><b>Guillermo</b><small>Administrator</small></div><span className="more">•••</span></div>
      </div>
    </aside>

    <section className="main-area">
      <header className="topbar"><div className="crumb">Workspace <span>/</span> <b>{activeFilter}</b></div><div className="top-actions"><span className="test-pill"><i/> TEST MODE</span><button className="icon-btn" title="Refresh" onClick={refresh}>↻</button><button className="primary" onClick={() => setShowComposer(true)}>＋ <span>New request</span></button></div></header>
      <div className="content">
        <div className="welcome"><div><div className="eyebrow">SIGNATURE WORKSPACE</div><h1>Your signature workspace</h1><p>Prepare documents, keep signers moving, and find every agreement in one place.</p></div><div className="welcome-stamp"><span>✦</span><small>Quietly<br/>in control</small></div></div>

        <div className="stat-grid"><article className="stat-card"><div className="stat-top"><span>ALL REQUESTS</span><span className="stat-icon lavender">↗</span></div><strong>{stats.total}</strong><small>Documents in SignWell</small></article><article className="stat-card"><div className="stat-top"><span>AWAITING SIGNATURE</span><span className="stat-icon sand">◷</span></div><strong>{stats.awaiting}</strong><small>Moving through the signing flow</small></article><article className="stat-card"><div className="stat-top"><span>COMPLETED</span><span className="stat-icon mint">✓</span></div><strong>{stats.completed}</strong><small>Ready for your records</small></article><article className="stat-card mode-card"><div className="stat-top"><span>ENVIRONMENT</span><span className="live-badge">SAFE</span></div><strong className="mode-text">Test mode</strong><small>Requests stay non-binding</small></article></div>

        <div className="table-heading"><div><h2>{activeFilter}</h2><p>{status}</p></div><div className="table-tools"><button className="subtle-btn" onClick={refresh}>↻ &nbsp; Sync</button><button className="subtle-btn">Filter &nbsp;⌄</button><button className="subtle-btn">⋯</button></div></div>
        {error && <div className="error-banner"><span>!</span>{error}<button onClick={() => setError("")}>×</button></div>}
        <div className="table-wrap"><table><thead><tr><th>DOCUMENT</th><th>RECIPIENTS</th><th>STATUS</th><th>UPDATED</th><th></th></tr></thead><tbody>
          {filtered.length ? filtered.map(doc => <tr key={doc.id}><td><div className="doc-cell"><div className="file-icon">PDF</div><div><b>{doc.name || "Untitled document"}</b><small>{String(doc.id).slice(0, 8)} · {doc.test_mode ? "Test" : "Live"} mode</small></div></div></td><td><div className="recipients">{(doc.recipients || []).slice(0,3).map((r,i)=><span key={i} title={r.email} className="recipient-avatar">{(r.name||r.email||"?").split(/[ @]/).map(s=>s[0]).join("").slice(0,2).toUpperCase()}</span>)}<span>{(doc.recipients||[]).length} signer{(doc.recipients||[]).length===1?"":"s"}</span></div></td><td><span className={`status-badge ${doc.status === "Completed" ? "complete" : doc.status === "Draft" ? "draft" : "pending"}`}><i/>{doc.status || "Unknown"}</span></td><td>{doc.updated_at ? time.format(new Date(doc.updated_at)) : "—"}</td><td><div className="row-actions">{doc.status === "Draft" && <button onClick={() => sendTest(doc.id)} disabled={busy} className="mini-action">Send test</button>}{["Sent","In progress","Pending"].includes(doc.status) && <button onClick={() => remind(doc.id)} disabled={busy} className="mini-action">Remind</button>}<a href={`https://www.signwell.com/app/documents/${doc.id}`} target="_blank" rel="noreferrer" title="Open in SignWell">↗</a></div></td></tr>) : <tr><td colSpan="5"><div className="empty"><div className="empty-icon">✍</div><h3>{documents.length ? "No documents in this view" : "A clear desk is a good start"}</h3><p>{documents.length ? "Choose another workspace view or create a new request." : "Upload a PDF and Signature Hub will prepare a test draft with a signature page for each signer."}</p><button className="primary" onClick={() => setShowComposer(true)}>＋ New request</button></div></td></tr>}
        </tbody></table></div>
        <div id="setup" className="setup-row"><div><b>Secure setup</b><span>Requests are locked to test mode. Drive archiving turns on after Google OAuth credentials are added to Vercel.</span></div><a href="/api/health" target="_blank" rel="noreferrer">View connection status ↗</a></div>
      </div>
    </section>

    {showComposer && <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setShowComposer(false)}><form className="composer" onSubmit={createDraft}><div className="modal-head"><div><span className="eyebrow">NEW SIGNATURE REQUEST</span><h2>Prepare a document</h2><p>Create a test-mode draft. No emails go out until you choose “Send test.”</p></div><button type="button" className="close" onClick={()=>setShowComposer(false)}>×</button></div><label className="field-label">Document name<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Residential lease agreement"/></label><label className="upload-box"><input type="file" accept="application/pdf,.pdf" onChange={e=>setFile(e.target.files?.[0]||null)}/><span className="upload-icon">↑</span><b>{file ? file.name : "Drop your PDF here, or browse"}</b><small>{file ? `${(file.size/1024/1024).toFixed(2)} MB · PDF` : "PDF only · 4 MB maximum"}</small></label><div className="signer-head"><div><b>Signers</b><small>Each signer receives an assigned signature on the appended page.</small></div><button type="button" className="add-signer" onClick={()=>setSigners(rows=>[...rows,blankSigner()])}>＋ Add signer</button></div><div className="signer-list">{signers.map((s,i)=><div className="signer-row" key={i}><span className="signer-num">{String(i+1).padStart(2,"0")}</span><input required placeholder="Full name" value={s.name} onChange={e=>updateSigner(i,"name",e.target.value)}/><input required type="email" placeholder="Email address" value={s.email} onChange={e=>updateSigner(i,"email",e.target.value)}/>{signers.length>1&&<button type="button" className="remove" onClick={()=>setSigners(rows=>rows.filter((_,n)=>n!==i))}>×</button>}</div>)}</div><label className="checkline"><input type="checkbox" checked={ordered} onChange={e=>setOrdered(e.target.checked)}/><span><b>Use signing order</b><small>Signers receive access one at a time in the order above.</small></span></label><div className="test-callout"><span>✓</span><div><b>Test mode is enforced</b><small>This draft cannot be legally binding. The signing page is added automatically; SignWell sends no email until you explicitly send a test invitation.</small></div></div>{error&&<div className="error-banner">{error}</div>}<div className="modal-foot"><button type="button" className="subtle-btn" onClick={()=>setShowComposer(false)}>Cancel</button><button disabled={busy} className="primary">{busy?"Preparing…":"Create test draft →"}</button></div></form></div>}
    {toast&&<div className="toast">✓ &nbsp; {toast}</div>}
  </main>;
}
