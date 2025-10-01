import { useEffect, useMemo, useState } from 'react';
import { Row, Col, Table, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type MenuItem = {
  id: number;
  name: string;
  price: number;
  description?: string;
};

AdminMenu.route = {
  path: '/admin/meny',
  menuLabel: 'Meny',
  index: 101,
  parent: '/admin',
  requiresRole: 'admin' as const
};

export default function AdminMenu() {
  const { user, loading } = useAuth();
  const location = useLocation();

  const [rows, setRows] = useState<MenuItem[] | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', price: 0, description: '' });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; price: number; description: string } | null>(null);
  const [savingId, setSavingId] = useState<number | 'new' | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const isAdmin = useMemo(() => !loading && !!user && user.role === 'admin', [user, loading]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setFetching(true);
      setError(null);
      try {
        const res = await fetch('/api/menu_items?orderBy=name', { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const list: MenuItem[] = await res.json();
        if (alive) setRows(list);
      } catch (e: any) {
        if (alive) setError(e?.message ?? 'Kunde inte hämta menyn.');
      } finally {
        if (alive) setFetching(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) {
    return <Row><Col><Spinner size="sm" className="me-2" /> Laddar...</Col></Row>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!isAdmin) {
    return <Row><Col><Alert variant='danger'>Åtkomst nekad. Endast admin.</Alert></Col></Row>;
  }

  async function saveNew(e: React.FormEvent) {
    e.preventDefault();
    setSavingId('new');
    setError(null);
    try {
      const res = await fetch('/api/menu_items', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error((json as any)?.error || `HTTP ${res.status}`);
      const insertId = Number((json as any)?.insertId);
      setRows([...(rows ?? []), { id: insertId, ...createForm } as MenuItem].sort((a, b) => a.name.localeCompare(b.name)));
      setCreateForm({ name: '', price: 0, description: '' });
      setCreating(false);
    } catch (e: any) {
      setError(e?.message ?? 'Misslyckades att skapa menyalternativ.');
    } finally {
      setSavingId(null);
    }
  }

  function startEdit(row: MenuItem) {
    setEditingId(row.id);
    setEditForm({ name: row.name, price: row.price, description: row.description ?? '' });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function saveEdit(id: number) {
    if (!editForm) return;
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/menu_items/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error((json as any)?.error || `HTTP ${res.status}`);
      setRows((rows ?? []).map(r => r.id === id ? { ...r, ...editForm } : r).sort((a, b) => a.name.localeCompare(b.name)));
      cancelEdit();
    } catch (e: any) {
      setError(e?.message ?? 'Misslyckades att uppdatera menyalternativ.');
    } finally {
      setSavingId(null);
    }
  }

  async function deleteRow(id: number) {
    if (!confirm('Ta bort detta menyalternativ?')) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/menu_items/${id}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error((json as any)?.error || `HTTP ${res.status}`);
      setRows((rows ?? []).filter(r => r.id !== id));
    } catch (e: any) {
      setError(e?.message ?? 'Misslyckades att ta bort menyalternativ.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Row>
      <Col>
        <h2>Admin: Meny</h2>
        {error && <Alert variant='danger' className='mt-2'>{error}</Alert>}

        <Form onSubmit={saveNew} className='mt-3 border rounded p-3'>
          <h5 className='mb-3'>Lägg till menyalternativ</h5>
          <div className='row g-2'>
            <div className='col-12 col-md-4'>
              <Form.Label className='mb-1'>Namn</Form.Label>
              <Form.Control value={createForm.name} required onChange={e => setCreateForm({ ...createForm, name: e.target.value })} />
            </div>
            <div className='col-12 col-md-2'>
              <Form.Label className='mb-1'>Pris</Form.Label>
              <Form.Control type='number' min={0} step='0.5' required value={createForm.price}
                onChange={e => setCreateForm({ ...createForm, price: Number(e.target.value) })} />
            </div>
            <div className='col-12 col-md-6'>
              <Form.Label className='mb-1'>Beskrivning</Form.Label>
              <Form.Control value={createForm.description}
                onChange={e => setCreateForm({ ...createForm, description: e.target.value })} />
            </div>
          </div>
          <div className='mt-3'>
            <Button type='submit' disabled={savingId === 'new'}>
              {savingId === 'new' ? <><Spinner size='sm' className='me-2' /> Skapar...</> : 'Lägg till'}
            </Button>
          </div>
        </Form>

        <div className='mt-4'>
          {fetching ? (
            <div className='d-flex align-items-center gap-2'><Spinner size='sm' /> <span>Laddar meny...</span></div>
          ) : !rows || rows.length === 0 ? (
            <Alert variant='info'>Inga menyalternativ ännu.</Alert>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Namn</th>
                  <th>Pris</th>
                  <th>Beskrivning</th>
                  <th>Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td style={{ minWidth: 200 }}>
                      {editingId === r.id ? (
                        <Form.Control value={editForm?.name ?? r.name}
                          onChange={e => setEditForm({ ...(editForm as any), name: e.target.value })} />
                      ) : (
                        r.name
                      )}
                    </td>
                    <td style={{ width: 140 }}>
                      {editingId === r.id ? (
                        <Form.Control type='number' min={0} step='0.5' value={editForm?.price ?? r.price}
                          onChange={e => setEditForm({ ...(editForm as any), price: Number(e.target.value) })} />
                      ) : (
                        r.price
                      )}
                    </td>
                    <td>
                      {editingId === r.id ? (
                        <Form.Control value={editForm?.description ?? r.description ?? ''}
                          onChange={e => setEditForm({ ...(editForm as any), description: e.target.value })} />
                      ) : (
                        r.description
                      )}
                    </td>
                    <td className='d-flex gap-2' style={{ width: 240 }}>
                      {editingId === r.id ? (
                        <>
                          <Button size='sm' variant='primary' disabled={savingId === r.id} onClick={() => saveEdit(r.id)}>
                            {savingId === r.id ? 'Sparar...' : 'Spara'}
                          </Button>
                          <Button size='sm' variant='secondary' onClick={cancelEdit}>Avbryt</Button>
                        </>
                      ) : (
                        <>
                          <Button size='sm' variant='outline-primary' onClick={() => startEdit(r)}>Redigera</Button>
                          <Button size='sm' variant='danger' disabled={deletingId === r.id} onClick={() => deleteRow(r.id)}>
                            {deletingId === r.id ? 'Tar bort...' : 'Ta bort'}
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </Col>
    </Row>
  );
}

