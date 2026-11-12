import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check, CheckCircle2, Circle, ClipboardList, Clock3, Edit3, ListFilter,
  LoaderCircle, LogOut, Plus, RefreshCw, Search, Trash2, X, LockKeyhole, Mail, UserRound
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const AUTH_KEY = 'daymark_auth';
const emptyForm = { title: '', description: '', dueDate: '' };

async function request(url, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try { const data = await response.json(); message = data.message || data.detail || message; } catch {}
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}
function formatDate(date) {
  if (!date) return 'No due date';
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function AuthScreen({ onAuthenticated, notify }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (mode === 'register' && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      const data = await request(`${API}/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        body: JSON.stringify(mode === 'login' ? { email, password } : { name, email, password })
      });
      onAuthenticated(data);
      notify(mode === 'login' ? `Welcome back, ${data.user.name}!` : `Account created. Welcome, ${data.user.name}!`);
    } catch (err) {
      setError(err.message || 'Unable to authenticate. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-art">
        <a className="brand auth-brand" href="#"><span className="brand-icon"><ClipboardList size={22}/></span><span>daymark<span className="brand-dot">.</span></span></a>
        <div className="art-copy">
          <span className="art-kicker">A LITTLE BETTER, EVERY DAY</span>
          <h1>Make space for<br/><span>what matters.</span></h1>
          <p>Your plans, your progress, your pace. Keep your day organized, one task at a time.</p>
          <div className="art-preview">
            <div className="preview-top"><span>Today’s focus</span><span className="preview-badge">3 tasks</span></div>
            <div className="preview-line"><span className="preview-check done"><Check size={13}/></span><span className="strike">Review project notes</span><CheckCircle2 size={16} className="green-icon"/></div>
            <div className="preview-line"><span className="preview-check"></span><span>Finish assignment draft</span><span className="mini-pending">Pending</span></div>
            <div className="preview-line"><span className="preview-check"></span><span>Plan tomorrow</span><span className="mini-pending">Pending</span></div>
          </div>
        </div>
        <p className="art-footer">A calmer way to get things done. <span>✦</span></p>
      </div>
      <div className="auth-main">
        <div className="auth-form-wrap">
          <div className="mobile-brand"><span className="brand-icon"><ClipboardList size={22}/></span><span>daymark<span className="brand-dot">.</span></span></div>
          <p className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}</p>
          <h2>{mode === 'login' ? 'Sign in to Daymark' : 'Create your account'}</h2>
          <p className="auth-subtitle">{mode === 'login' ? 'Pick up where you left off.' : 'Your own space to plan and make progress.'}</p>
          <div className="auth-switch">
            <button className={mode === 'login' ? 'selected' : ''} onClick={() => {setMode('login'); setError('');}}>Sign in</button>
            <button className={mode === 'register' ? 'selected' : ''} onClick={() => {setMode('register'); setError('');}}>Create account</button>
          </div>
          <form className="auth-form" onSubmit={submit}>
            {mode === 'register' && <><label htmlFor="fullName">Full name</label><div className="auth-input"><UserRound size={17}/><input id="fullName" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" required maxLength={100}/></div></>}
            <label htmlFor="email">Email address</label>
            <div className="auth-input"><Mail size={17}/><input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email"/></div>
            <label htmlFor="password">Password</label>
            <div className="auth-input"><LockKeyhole size={17}/><input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} maxLength={72} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}/></div>
            {mode === 'register' && <><label htmlFor="confirm">Confirm password</label><div className="auth-input"><LockKeyhole size={17}/><input id="confirm" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Enter password again" required minLength={8} maxLength={72} autoComplete="new-password"/></div></>}
            {error && <div className="auth-error" role="alert"><X size={16}/>{error}</div>}
            <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18}/> : null}{busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}{!busy && <span>→</span>}</button>
          </form>
          <p className="auth-privacy"><LockKeyhole size={13}/> Your tasks are private to your account.</p>
        </div>
      </div>
    </div>
  );
}

function TaskWorkspace({ auth, onLogout, notify }) {
  const token = auth.token;
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await request(`${API}/tasks`, {}, token);
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      notify(`${error.message}. Check that the backend is running and sign in again if needed.`, 'error');
      if (error.message.includes('(401)') || error.message.includes('(403)')) onLogout(false);
    } finally { setLoading(false); }
  }, [token, notify, onLogout]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const counts = useMemo(() => ({
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'PENDING').length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length
  }), [tasks]);

  const visibleTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter(t => (filter === 'ALL' || t.status === filter) &&
      (!q || t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)));
  }, [tasks, filter, search]);

  function resetForm() { setForm(emptyForm); setEditingId(null); }
  function beginEdit(task) {
    setEditingId(task.id);
    setForm({ title: task.title || '', description: task.description || '', dueDate: task.dueDate || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) { notify('Task title is required.', 'error'); return; }
    setSaving(true);
    const payload = { title, description: form.description.trim(), dueDate: form.dueDate || null };
    try {
      if (editingId !== null) {
        await request(`${API}/tasks/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) }, token);
        notify('Task updated successfully.');
      } else {
        await request(`${API}/tasks`, { method: 'POST', body: JSON.stringify(payload) }, token);
        notify('Task added successfully.');
      }
      resetForm();
      await loadTasks();
    } catch (error) { notify(error.message || 'Could not save task.', 'error'); }
    finally { setSaving(false); }
  }

  async function toggleStatus(task) {
    const status = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await request(`${API}/tasks/${task.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token);
      notify(status === 'COMPLETED' ? 'Task marked as completed.' : 'Task moved to pending.');
      await loadTasks();
    } catch (error) { notify(error.message, 'error'); }
  }

  async function deleteTask(task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    try {
      await request(`${API}/tasks/${task.id}`, { method: 'DELETE' }, token);
      if (editingId === task.id) resetForm();
      notify('Task deleted successfully.');
      await loadTasks();
    } catch (error) { notify(error.message, 'error'); }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-icon"><ClipboardList size={22}/></span><span>daymark<span className="brand-dot">.</span></span></a>
        <div className="topbar-right"><span className="user-greeting">Hello, {auth.user.name}</span><button className="logout-button" onClick={() => onLogout(true)}><LogOut size={15}/> Log out</button></div>
      </header>
      <main className="main-content">
        <section className="hero"><div><p className="eyebrow">YOUR DAY, IN FOCUS</p><h1>Make today <span>count.</span></h1><p className="hero-copy">A little progress each day adds up to big results.</p></div>
          <div className="date-chip"><Clock3 size={16}/>{new Date().toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'short'})}</div>
        </section>
        <section className="stats-grid">
          <div className="stat-card stat-total"><div className="stat-icon"><ClipboardList size={19}/></div><p>Total tasks</p><strong>{counts.all}</strong><span>Across your list</span></div>
          <div className="stat-card stat-pending"><div className="stat-icon"><Circle size={19}/></div><p>Pending</p><strong>{counts.pending}</strong><span>Still on your list</span></div>
          <div className="stat-card stat-completed"><div className="stat-icon"><CheckCircle2 size={19}/></div><p>Completed</p><strong>{counts.completed}</strong><span>Nicely done!</span></div>
        </section>
        <section className="workspace">
          <aside className="form-panel">
            <div className="panel-heading"><div className="heading-icon"><Plus size={19}/></div><div><h2>{editingId !== null ? 'Edit task' : 'Create a task'}</h2><p>{editingId !== null ? 'Make changes to your task.' : 'What would you like to get done?'}</p></div></div>
            <form onSubmit={handleSubmit}>
              <label htmlFor="title">Task title <span className="required">*</span></label>
              <input id="title" value={form.title} maxLength={150} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Finish project report" required/>
              <label htmlFor="description">Description <span className="optional">Optional</span></label>
              <textarea id="description" value={form.description} maxLength={1000} rows={4} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Add a few details about this task..."/>
              <label htmlFor="dueDate">Due date <span className="optional">Optional</span></label>
              <input id="dueDate" type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/>
              <button className="primary-button submit-button" type="submit" disabled={saving}>{saving?<LoaderCircle className="spin" size={18}/>:editingId!==null?<Check size={18}/>:<Plus size={18}/>} {saving?'Saving...':editingId!==null?'Save changes':'Add task'}</button>
              {editingId!==null&&<button className="cancel-button" type="button" onClick={resetForm}><X size={16}/> Cancel editing</button>}
            </form>
            <div className="form-tip"><span>✦</span><p><strong>One step at a time.</strong><br/>Break big goals into small, doable tasks.</p></div>
          </aside>
          <section className="task-panel">
            <div className="task-panel-header"><div><p className="eyebrow">YOUR WORKSPACE</p><h2>My tasks <span className="count-pill">{counts.all}</span></h2></div><button className="icon-button" onClick={loadTasks} title="Refresh tasks" aria-label="Refresh tasks"><RefreshCw size={17}/></button></div>
            <div className="filter-row">{[['ALL','All tasks',counts.all],['PENDING','Pending',counts.pending],['COMPLETED','Completed',counts.completed]].map(([value,label,count])=><button key={value} className={`filter-tab ${filter===value?'active':''}`} onClick={()=>setFilter(value)}>{label}<span>{count}</span></button>)}</div>
            <div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search your tasks..." aria-label="Search tasks"/>{search&&<button onClick={()=>setSearch('')} aria-label="Clear search"><X size={15}/></button>}</div>
            {loading?<div className="state-panel"><LoaderCircle className="spin" size={28}/><p>Loading your tasks...</p></div>:visibleTasks.length===0?<div className="empty-state"><div className="empty-icon">{search?<Search size={25}/>:<ListFilter size={25}/>}</div><h3>{search?'No matching tasks':filter==='COMPLETED'?'No completed tasks yet':filter==='PENDING'?'You’re all caught up!':'A fresh start'}</h3><p>{search?'Try a different search term.':filter==='COMPLETED'?'Complete a task and it will show up here.':filter==='PENDING'?'There are no pending tasks right now.':'Add your first task using the form to get started.'}</p></div>:<div className="task-list">{visibleTasks.map(task=><article className={`task-card ${task.status==='COMPLETED'?'is-completed':''}`} key={task.id}>
              <button className={`complete-toggle ${task.status==='COMPLETED'?'checked':''}`} onClick={()=>toggleStatus(task)} title={task.status==='COMPLETED'?'Mark as pending':'Mark as completed'} aria-label={task.status==='COMPLETED'?'Mark as pending':'Mark as completed'}>{task.status==='COMPLETED'&&<Check size={15}/>}</button>
              <div className="task-content"><div className="task-title-row"><h3>{task.title}</h3><span className={`status-badge ${task.status==='COMPLETED'?'completed':'pending'}`}><span/>{task.status==='COMPLETED'?'Completed':'Pending'}</span></div>
                {task.description&&<p className="task-description">{task.description}</p>}<div className="task-meta"><Clock3 size={14}/><span>{formatDate(task.dueDate)}</span></div>
                <div className="task-actions"><button onClick={()=>beginEdit(task)}><Edit3 size={14}/> Edit</button><button className="delete-action" onClick={()=>deleteTask(task)}><Trash2 size={14}/> Delete</button></div>
              </div></article>)}</div>}
            <div className="list-footer"><span>Showing {visibleTasks.length} of {counts.all} tasks</span><span><span className="footer-dot"/> Private to your account</span></div>
          </section>
        </section>
        <footer className="page-footer">Made for a more focused day <span>✦</span></footer>
      </main>
    </div>
  );
}

export default function App() {
  const [auth, setAuth] = useState(() => {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch { return null; }
  });
  const [notice, setNotice] = useState(null);
  const notify = useCallback((message, type='success') => setNotice({message,type,id:Date.now()+Math.random()}), []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3600);
    return () => clearTimeout(timer);
  }, [notice]);
  const handleAuthenticated = useCallback(data => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
    setAuth(data);
  }, []);
  const logout = useCallback((showMessage=true) => {
    localStorage.removeItem(AUTH_KEY);
    setAuth(null);
    if (showMessage) notify('You have been logged out.');
  }, [notify]);
  return <>
    {auth?.token && auth?.user ? <TaskWorkspace auth={auth} onLogout={logout} notify={notify}/> : <AuthScreen onAuthenticated={handleAuthenticated} notify={notify}/>}
    {notice && <div className={`toast ${notice.type}`} role="status">{notice.type==='success'?<CheckCircle2 size={19}/>:<X size={19}/>}<span>{notice.message}</span><button onClick={()=>setNotice(null)} aria-label="Dismiss notification"><X size={16}/></button></div>}
  </>;
}
