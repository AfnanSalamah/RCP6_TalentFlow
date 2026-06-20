import { useEffect, useState } from 'react';
import SALayout from '../components/Layout';
import { saApi } from '../api/index';
import { Building2, KeyRound, Plus, Search, UserCheck, UserX, X } from 'lucide-react';

const emptyAdd = {
  accountType: 'employee',
  name: '',
  email: '',
  password: '',
  company_id: '',
  employee_id: '',
  role: 'hr_manager',
  department: '',
  title: '',
  phone: '',
  location: '',
  headline: '',
  status: 'active',
};

export default function SAUsers() {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [pwModal, setPwModal] = useState(null);
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyAdd);
  const [addMsg, setAddMsg] = useState('');
  const [savingAdd, setSavingAdd] = useState(false);

  const load = () => {
    setLoading(true);
    saApi.listUsers(search ? { search } : {}).then(setUsers).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { saApi.listCompanies().then(setCompanies).catch(() => setCompanies([])); }, []);

  async function toggleUser(u) {
    if (!window.confirm(`${u.status === 'active' ? 'Disable' : 'Enable'} "${u.name}"?`)) return;
    await (u.status === 'active' ? saApi.disableUser(u.id, u.account_type) : saApi.enableUser(u.id, u.account_type));
    load();
  }

  async function handlePasswordReset() {
    if (!newPw.trim()) { setPwMsg('Password cannot be empty'); return; }
    try {
      await saApi.resetPassword(pwModal.id, newPw, pwModal.account_type);
      setPwMsg('Password reset successfully!');
      setTimeout(() => { setPwModal(null); setNewPw(''); setPwMsg(''); }, 1200);
    } catch (e) { setPwMsg(e.message); }
  }

  async function handleAddUser() {
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password.trim()) {
      setAddMsg('Name, email, and password are required');
      return;
    }
    setSavingAdd(true);
    setAddMsg('');
    try {
      if (addForm.accountType === 'employee') {
        await saApi.createHrUser({
          name: addForm.name,
          email: addForm.email,
          password: addForm.password,
          company_id: addForm.company_id ? Number(addForm.company_id) : null,
          employee_id: addForm.employee_id || undefined,
          role: addForm.role,
          department: addForm.department,
          title: addForm.title,
          status: addForm.status,
        });
      } else {
        await saApi.createApplicant({
          name: addForm.name,
          email: addForm.email,
          password: addForm.password,
          phone: addForm.phone,
          location: addForm.location,
          headline: addForm.headline,
          status: addForm.status,
        });
      }
      setAddForm(emptyAdd);
      setAddOpen(false);
      load();
    } catch (e) {
      setAddMsg(e.message || 'Could not create user');
    } finally {
      setSavingAdd(false);
    }
  }

  const filtered = users.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );
  const roleColors = { super_admin: '#7C3AED', admin: '#001D39', hr_manager: '#0A4174', hiring_manager: '#4E8EA2', interviewer: '#49769F', candidate: '#047857' };

  return (
    <SALayout title="User Management">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={searchBox}>
            <Search size={16} color="#94A3B8" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Search by name or email..." style={searchInput} />
            {search && <button onClick={() => { setSearch(''); setTimeout(load, 10); }} style={ghostIcon}><X size={14} /></button>}
          </div>
          <button onClick={() => { setAddOpen(true); setAddMsg(''); }} style={primaryBtn}><Plus size={16} /> Add User</button>
        </div>

        <div style={tableWrap}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                {['User', 'ID', 'Role', 'Department', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={emptyCell}>Loading...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={7} style={emptyCell}>No users found</td></tr>
              : filtered.map(u => (
                <tr key={`${u.account_type}-${u.id}`} style={{ borderBottom: '1px solid #F8FAFC' }}>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ ...avatar, background: u.account_type === 'candidate' ? 'linear-gradient(135deg,#047857,#4E8EA2)' : 'linear-gradient(135deg,#001D39,#0A4174)' }}>
                        {(u.name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...td, fontSize: 13, color: '#475569', fontFamily: 'monospace' }}>{u.employee_id}</td>
                  <td style={td}>
                    <span style={{ ...pill, background: u.account_type === 'candidate' ? '#ECFDF3' : '#EFF6FF', color: roleColors[u.role] || '#475569' }}>
                      {(u.role || '').replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ ...td, fontSize: 13, color: '#475569' }}>{u.department || '-'}</td>
                  <td style={td}>
                    <span style={{ ...pill, background: u.status === 'active' ? '#D1FAE5' : '#FEF2F2', color: u.status === 'active' ? '#065F46' : '#DC2626' }}>{u.status}</span>
                  </td>
                  <td style={{ ...td, fontSize: 12, color: '#94A3B8' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button title={u.status === 'active' ? 'Disable' : 'Enable'} onClick={() => toggleUser(u)} style={{ ...actionBtn, background: u.status === 'active' ? '#FEF2F2' : '#D1FAE5', color: u.status === 'active' ? '#DC2626' : '#059669' }}>
                        {u.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                      <button title="Reset Password" onClick={() => { setPwModal(u); setPwMsg(''); setNewPw(''); }} style={{ ...actionBtn, background: '#FFFBEB', color: '#D97706' }}>
                        <KeyRound size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen && (
        <div style={modalBackdrop} onClick={() => setAddOpen(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <div>
                <h2 style={modalTitle}>Add User</h2>
                <p style={modalSub}>Create employees for companies or candidate accounts.</p>
              </div>
              <button onClick={() => setAddOpen(false)} style={closeBtn}><X size={16} /></button>
            </div>
            <div style={{ padding: 20, display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {['employee', 'candidate'].map(t => (
                  <button key={t} onClick={() => setAddForm(f => ({ ...f, accountType: t }))} style={{ ...tabBtn, borderColor: addForm.accountType === t ? '#0A4174' : '#E2E8F0', background: addForm.accountType === t ? '#EAF6FC' : '#fff' }}>
                    {t === 'employee' ? 'Employee / HR' : 'Candidate'}
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                <Field label="Full Name"><input style={inputSt} value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} /></Field>
                <Field label="Email"><input style={inputSt} type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} /></Field>
                <Field label="Password"><input style={inputSt} type="password" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} /></Field>
                <Field label="Status"><select style={inputSt} value={addForm.status} onChange={e => setAddForm({ ...addForm, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
                {addForm.accountType === 'employee' ? (
                  <>
                    <Field label="Company"><select style={inputSt} value={addForm.company_id} onChange={e => setAddForm({ ...addForm, company_id: e.target.value })}><option value="">No company</option>{companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}</select></Field>
                    <Field label="Role"><select style={inputSt} value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })}><option value="admin">Admin</option><option value="hr_manager">HR Manager</option><option value="hiring_manager">Hiring Manager</option><option value="interviewer">Interviewer</option></select></Field>
                    <Field label="Employee ID"><input style={inputSt} value={addForm.employee_id} onChange={e => setAddForm({ ...addForm, employee_id: e.target.value })} placeholder="Auto if empty" /></Field>
                    <Field label="Department"><input style={inputSt} value={addForm.department} onChange={e => setAddForm({ ...addForm, department: e.target.value })} /></Field>
                    <Field label="Job Title"><input style={inputSt} value={addForm.title} onChange={e => setAddForm({ ...addForm, title: e.target.value })} /></Field>
                  </>
                ) : (
                  <>
                    <Field label="Phone"><input style={inputSt} value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} /></Field>
                    <Field label="Location"><input style={inputSt} value={addForm.location} onChange={e => setAddForm({ ...addForm, location: e.target.value })} /></Field>
                    <Field label="Headline"><input style={inputSt} value={addForm.headline} onChange={e => setAddForm({ ...addForm, headline: e.target.value })} /></Field>
                  </>
                )}
              </div>
              {addMsg && <div style={{ padding: '10px 12px', borderRadius: 10, background: '#FEF2F2', color: '#B91C1C', fontSize: 13, fontWeight: 700 }}>{addMsg}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748B', fontSize: 12 }}><Building2 size={14} /> Employees can be linked to a company.</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setAddOpen(false)} style={cancelBtn}>Cancel</button>
                  <button onClick={handleAddUser} disabled={savingAdd} style={{ ...primaryBtn, opacity: savingAdd ? 0.7 : 1 }}>{savingAdd ? 'Creating...' : 'Create User'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {pwModal && (
        <div style={modalBackdrop} onClick={() => setPwModal(null)}>
          <div style={{ ...modalBox, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <h2 style={modalTitle}>Reset Password - {pwModal.name}</h2>
              <button onClick={() => setPwModal(null)} style={closeBtn}><X size={16} /></button>
            </div>
            <div style={{ padding: 20 }}>
              <Field label="New Password"><input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Enter new password" style={inputSt} /></Field>
              {pwMsg && <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, marginTop: 12, background: pwMsg.includes('success') ? '#D1FAE5' : '#FEF2F2', color: pwMsg.includes('success') ? '#065F46' : '#DC2626' }}>{pwMsg}</div>}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={() => setPwModal(null)} style={{ ...cancelBtn, flex: 1 }}>Cancel</button>
                <button onClick={handlePasswordReset} style={{ ...primaryBtn, flex: 2 }}>Reset Password</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SALayout>
  );
}

function Field({ label, children }) {
  return <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 800, color: '#475569' }}>{label}{children}</label>;
}

const searchBox = { display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '10px 16px', maxWidth: 520, flex: 1 };
const searchInput = { border: 'none', outline: 'none', fontSize: 14, flex: 1, background: 'transparent', color: '#0F172A' };
const ghostIcon = { background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' };
const primaryBtn = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 'none', borderRadius: 12, padding: '11px 16px', background: 'linear-gradient(135deg,#001D39,#0A4174)', color: '#fff', fontWeight: 800, cursor: 'pointer' };
const tableWrap = { background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9', overflow: 'hidden' };
const th = { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' };
const td = { padding: '14px 16px' };
const emptyCell = { padding: 40, textAlign: 'center', color: '#94A3B8' };
const avatar = { width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 };
const pill = { padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800 };
const actionBtn = { width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalBackdrop = { position: 'fixed', inset: 0, background: 'rgba(0,29,57,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
const modalBox = { background: '#fff', borderRadius: 18, maxWidth: 720, width: '100%', overflow: 'hidden', boxShadow: '0 24px 70px rgba(15,23,42,0.22)' };
const modalHeader = { padding: 20, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 };
const modalTitle = { fontSize: 18, fontWeight: 900, margin: 0, color: '#0F172A' };
const modalSub = { margin: '4px 0 0', color: '#64748B', fontSize: 13 };
const closeBtn = { background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', display: 'grid', placeItems: 'center' };
const tabBtn = { flex: 1, border: '1.5px solid #E2E8F0', color: '#0F172A', borderRadius: 12, padding: 12, fontWeight: 800, cursor: 'pointer' };
const inputSt = { width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', color: '#0F172A', background: '#fff', boxSizing: 'border-box' };
const cancelBtn = { padding: '10px 16px', border: '1px solid #E2E8F0', borderRadius: 10, background: '#fff', color: '#475569', fontWeight: 800, cursor: 'pointer' };
