import { useEffect, useState } from 'react';
import { api, uploadCover } from './api.js';

function Err({ e }) {
  if (!e) return null;
  return <p className="err">{e.code ? `${e.code}: ` : ''}{e.message}</p>;
}

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [e, setE] = useState(null);
  return (
    <div className="login-wrap">
      <section className="card login-card">
        <h1>Manager Library</h1>
        <p className="sub">Catalog, loans and reports for a small library.</p>
        <Err e={e} />
        <form onSubmit={async (ev) => {
          ev.preventDefault(); setE(null);
          try { onLogin(await api('/auth/login', { method: 'POST', body: { username, password } })); }
          catch (err) { setE(err); }
        }}>
          <input placeholder="username" value={username} onChange={(ev) => setUsername(ev.target.value)} />
          <input placeholder="password" type="password" value={password} onChange={(ev) => setPassword(ev.target.value)} />
          <button type="submit">Enter</button>
        </form>
      </section>
    </div>
  );
}

function Books({ token, admin }) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [e, setE] = useState(null);
  const [form, setForm] = useState({ title: '', author: '', isbn: '', category_id: '', total_copies: 1 });
  const search = async () => {
    setE(null);
    try { const r = await api(`/books?q=${encodeURIComponent(q)}&size=20`, { token }); setItems(r.items); }
    catch (err) { setE(err); }
  };
  useEffect(() => { search(); }, []);
  return (
    <section className="card">
      <h2>Catalog</h2>
      <Err e={e} />
      <div className="row">
        <input placeholder="title or author" value={q} onChange={(ev) => setQ(ev.target.value)} />
        <button onClick={search}>Search</button>
      </div>
      {items.length === 0 ? <p className="empty">No books found.</p> : (
        <ul className="books">
          {items.map((b) => (
            <li key={b.id}>
              <span className="stock">{b.available_copies}/{b.total_copies} available</span>
              <span className="title">{b.title}</span>
              <div className="meta">{b.author} · {b.isbn} · {b.category?.name}</div>
              {admin && (
                <label className="meta"> cover <input type="file" accept="image/jpeg,image/png" onChange={async (ev) => {
                  const f = ev.target.files[0]; if (!f) return;
                  try { await uploadCover(token, b.id, f); search(); } catch (err) { setE(err); }
                }} /></label>
              )}
            </li>
          ))}
        </ul>
      )}
      {admin && (
        <form onSubmit={async (ev) => {
          ev.preventDefault(); setE(null);
          try {
            await api('/books', { token, method: 'POST', body: { ...form, total_copies: Number(form.total_copies) } });
            setForm({ title: '', author: '', isbn: '', category_id: '', total_copies: 1 }); search();
          } catch (err) { setE(err); }
        }}>
          <h3>New book (admin)</h3>
          <input placeholder="title" value={form.title} onChange={(ev) => setForm({ ...form, title: ev.target.value })} />
          <input placeholder="author" value={form.author} onChange={(ev) => setForm({ ...form, author: ev.target.value })} />
          <input placeholder="isbn 13 digits" value={form.isbn} onChange={(ev) => setForm({ ...form, isbn: ev.target.value })} />
          <input placeholder="category_id" value={form.category_id} onChange={(ev) => setForm({ ...form, category_id: ev.target.value })} />
          <input placeholder="copies" type="number" min="1" value={form.total_copies} onChange={(ev) => setForm({ ...form, total_copies: ev.target.value })} />
          <button type="submit">Create</button>
        </form>
      )}
    </section>
  );
}

function Members({ token }) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [e, setE] = useState(null);
  const [form, setForm] = useState({ full_name: '', document_number: '' });
  const search = async () => {
    setE(null);
    try { const r = await api(`/members?q=${encodeURIComponent(q)}&size=20`, { token }); setItems(r.items); }
    catch (err) { setE(err); }
  };
  useEffect(() => { search(); }, []);
  return (
    <section className="card">
      <h2>Members</h2>
      <Err e={e} />
      <div className="row">
        <input placeholder="name or document" value={q} onChange={(ev) => setQ(ev.target.value)} />
        <button onClick={search}>Search</button>
      </div>
      <ul className="plain">{items.map((m) => <li key={m.id}>{m.full_name} — {m.document_number} ({m.active_loans ?? 0} open)</li>)}</ul>
      <form onSubmit={async (ev) => {
        ev.preventDefault(); setE(null);
        try { await api('/members', { token, method: 'POST', body: form }); setForm({ full_name: '', document_number: '' }); search(); }
        catch (err) { setE(err); }
      }}>
        <h3>New member</h3>
        <input placeholder="full name" value={form.full_name} onChange={(ev) => setForm({ ...form, full_name: ev.target.value })} />
        <input placeholder="document" value={form.document_number} onChange={(ev) => setForm({ ...form, document_number: ev.target.value })} />
        <button type="submit">Create</button>
      </form>
    </section>
  );
}

function Loans({ token }) {
  const [memberId, setMemberId] = useState('');
  const [bookIds, setBookIds] = useState('');
  const [loanId, setLoanId] = useState('');
  const [detail, setDetail] = useState(null);
  const [e, setE] = useState(null);
  const lend = async (ev) => {
    ev.preventDefault(); setE(null);
    try {
      const items = bookIds.split(',').map((s) => s.trim()).filter(Boolean).map((book_id) => ({ book_id }));
      setDetail(await api('/loans', { token, method: 'POST', body: { member_id: memberId, items } }));
    } catch (err) { setE(err); }
  };
  const back = async (loan_id, item_id) => {
    setE(null);
    try { setDetail(await api(`/loans/${loan_id}/items/${item_id}/return`, { token, method: 'POST' })); }
    catch (err) { setE(err); }
  };
  return (
    <section className="card">
      <h2>Loans</h2>
      <Err e={e} />
      <form onSubmit={lend}>
        <input placeholder="member_id" value={memberId} onChange={(ev) => setMemberId(ev.target.value)} />
        <input placeholder="book ids, comma separated (1-3)" value={bookIds} onChange={(ev) => setBookIds(ev.target.value)} />
        <button type="submit">Lend</button>
      </form>
      <form onSubmit={async (ev) => {
        ev.preventDefault(); setE(null);
        try { setDetail(await api(`/loans/${loanId}`, { token })); } catch (err) { setE(err); }
      }}>
        <input placeholder="loan_id to inspect" value={loanId} onChange={(ev) => setLoanId(ev.target.value)} />
        <button type="submit">Open</button>
      </form>
      {detail?.items && (
        <ul className="plain">{detail.items.map((it) => (
          <li key={it.id}>
            {it.book_title} — due {it.due_at}{it.returned_at ? ` (returned ${it.returned_at})` : (
              <button className="link" onClick={() => back(detail.id ?? detail.loan_id, it.id)}>Return</button>)}
          </li>))}
        </ul>
      )}
    </section>
  );
}

function Overdue({ token }) {
  const [items, setItems] = useState([]);
  const [e, setE] = useState(null);
  useEffect(() => { api('/loans/overdue', { token }).then((r) => setItems(r.items)).catch(setE); }, []);
  return (
    <section className="card">
      <h2>Overdue</h2>
      <Err e={e} />
      {items.length === 0 ? <p className="empty">Nothing overdue.</p> : (
        <ul className="plain">{items.map((it) => (
          <li key={it.item_id}>{it.book_title} — {it.member_name} — {it.days_late} days late</li>))}
        </ul>
      )}
    </section>
  );
}

function Report({ token }) {
  const [from, setFrom] = useState('2026-10-01');
  const [to, setTo] = useState('2026-10-31');
  const [rows, setRows] = useState([]);
  const [e, setE] = useState(null);
  return (
    <section className="card">
      <h2>Most borrowed (admin)</h2>
      <Err e={e} />
      <form onSubmit={async (ev) => {
        ev.preventDefault(); setE(null);
        try { const r = await api(`/reports/most-borrowed?from=${from}&to=${to}`, { token }); setRows(r.rows); }
        catch (err) { setE(err); }
      }}>
        <input type="date" value={from} onChange={(ev) => setFrom(ev.target.value)} />
        <input type="date" value={to} onChange={(ev) => setTo(ev.target.value)} />
        <button type="submit">Run</button>
      </form>
      <ul className="plain">{rows.map((r) => <li key={r.book_id}>{r.book_title} ({r.category_name}) — {r.times_borrowed}×</li>)}</ul>
    </section>
  );
}

const VIEWS = [['books', 'Catalog'], ['members', 'Members'], ['loans', 'Loans'], ['overdue', 'Overdue']];

export default function App() {
  const [auth, setAuth] = useState(() => JSON.parse(localStorage.getItem('ml-auth') ?? 'null'));
  const [view, setView] = useState('books');
  const login = (data) => {
    const a = { token: data.access_token, role: data.role };
    localStorage.setItem('ml-auth', JSON.stringify(a)); setAuth(a);
  };
  const logout = () => { localStorage.removeItem('ml-auth'); setAuth(null); };
  if (!auth) return <main><Login onLogin={login} /></main>;
  const admin = auth.role === 'admin';
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">Manager Library</span>
          <span className="role">{auth.role}</span>
          <nav>
            {VIEWS.map(([k, l]) => <button key={k} className={view === k ? 'active' : ''} onClick={() => setView(k)}>{l}</button>)}
            {admin && <button className={view === 'report' ? 'active' : ''} onClick={() => setView('report')}>Report</button>}
            <button className="logout" onClick={logout}>Logout</button>
          </nav>
        </div>
      </header>
      <main>
        <div className="hero">
          <h1>{VIEWS.find(([k]) => k === view)?.[1] ?? 'Report'}</h1>
        </div>
        {view === 'books' && <Books token={auth.token} admin={admin} />}
        {view === 'members' && <Members token={auth.token} />}
        {view === 'loans' && <Loans token={auth.token} />}
        {view === 'overdue' && <Overdue token={auth.token} />}
        {view === 'report' && admin && <Report token={auth.token} />}
      </main>
    </>
  );
}
