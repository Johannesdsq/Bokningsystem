import { useEffect, useMemo, useState } from 'react';
import { Row, Col, Table, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type TableRow = {
  id: number;
  tableNumber: number;
  seats: number;
  description?: string;
};

AdminTables.route = {
  path: '/admin/bord',
  menuLabel: 'Bord',
  index: 99,
  parent: '/admin',
  requiresRole: 'admin' as const
};

export default function AdminTables() {
  const { user, loading } = useAuth();
  const location = useLocation();

  const [rows, setRows] = useState<TableRow[] | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ tableNumber: 1, seats: 2, description: '' });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ tableNumber: number; seats: number; description: string } | null>(null);
  const [savingId, setSavingId] = useState<number | 'new' | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const canRender = useMemo(() => !loading && !!user && user.role === 'admin', [user, loading]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setFetching(true);
      setError(null);
      try {
        const res = await fetch('/api/tables', { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const list: TableRow[] = await res.json();
        if (alive) setRows(list);
      } catch (e: any) {
        if (alive) setError(e?.message ?? 'Kunde inte hämta borden.');
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

  if (user.role !== 'admin') {
    return <Row><Col><Alert variant="danger">Åtkomst nekad. Endast admin.</Alert></Col></Row>;
  }

  function startEdit(row: TableRow) {
    setEditingId(row.id);
    setEditForm({
      tableNumber: row.tableNumber,
      seats: row.seats,
      description: row.description ?? ''
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function saveNew(e: React.FormEvent) {
    e.preventDefault();
    setSavingId('new');
    setError(null);
    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error((json as any)?.error || `HTTP ${res.status}`);
      const insertId = Number((json as any)?.insertId);
      const created: TableRow = { id: insertId, ...createForm } as any;
      setRows([...(rows ?? []), created].sort((a, b) => a.tableNumber - b.tableNumber));
      setCreateForm({ tableNumber: 1, seats: 2, description: '' });
    } catch (e: any) {
      setError(e?.message ?? 'Misslyckades att skapa bord.');
    } finally {
      setSavingId(null);
    }
  }

  async function saveEdit(id: number) {
    if (!editForm) return;
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/tables/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error((json as any)?.error || `HTTP ${res.status}`);
      setRows((rows ?? []).map(r => r.id === id ? { ...r, ...editForm } : r));
      cancelEdit();
    } catch (e: any) {
      setError(e?.message ?? 'Misslyckades att uppdatera bord.');
    } finally {
      setSavingId(null);
    }
  }

  async function deleteRow(id: number) {
    if (!confirm('Ta bort detta bord?')) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/tables/${id}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error((json as any)?.error || `HTTP ${res.status}`);
      setRows((rows ?? []).filter(r => r.id !== id));
    } catch (e: any) {
      setError(e?.message ?? 'Misslyckades att ta bort bord.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Row>
      <Col>
        <h2>Admin: Bord</h2>

        {error && <Alert variant="danger" className="mt-2">{error}</Alert>}

        <Form onSubmit={saveNew} className="mt-3 border rounded p-3">
          <h5 className="mb-3">Skapa nytt bord</h5>
          <div className="row g-2">
            <div className="col-12 col-md-3">
              <Form.Label className="mb-1">Bordsnummer</Form.Label>
              <Form.Control type="number" min={1} required value={createForm.tableNumber}
                onChange={e => setCreateForm({ ...createForm, tableNumber: Number(e.target.value) })} />
            </div>
            <div className="col-12 col-md-3">
              <Form.Label className="mb-1">Platser</Form.Label>
              <Form.Control type="number" min={1} required value={createForm.seats}
                onChange={e => setCreateForm({ ...createForm, seats: Number(e.target.value) })} />
            </div>
            <div className="col-12 col-md-6">
              <Form.Label className="mb-1">Beskrivning</Form.Label>
              <Form.Control value={createForm.description}
                onChange={e => setCreateForm({ ...createForm, description: e.target.value })} />
            </div>
          </div>
          <div className="mt-3">
            <Button type="submit" disabled={savingId === 'new'}>
              {savingId === 'new' ? <><Spinner size="sm" className="me-2" /> Skapar...</> : 'Skapa bord'}
            </Button>
          </div>
        </Form>

        <div className="mt-4">
          {fetching ? (
            <div className='d-flex align-items-center gap-2'><Spinner size='sm' /> <span>Laddar bord...</span></div>
          ) : !rows || rows.length === 0 ? (
            <Alert variant='info'>Inga bord ännu.</Alert>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Bordsnummer</th>
                  <th>Platser</th>
                  <th>Beskrivning</th>
                  <th>Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td style={{ width: 160 }}>
                      {editingId === r.id ? (
                        <Form.Control type="number" min={1} value={editForm?.tableNumber ?? r.tableNumber}
                          onChange={e => setEditForm({ ...(editForm as any), tableNumber: Number(e.target.value) })} />
                      ) : (
                        r.tableNumber
                      )}
                    </td>
                    <td style={{ width: 160 }}>
                      {editingId === r.id ? (
                        <Form.Control type="number" min={1} value={editForm?.seats ?? r.seats}
                          onChange={e => setEditForm({ ...(editForm as any), seats: Number(e.target.value) })} />
                      ) : (
                        r.seats
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
                    <td className="d-flex gap-2" style={{ width: 240 }}>
                      {editingId === r.id ? (
                        <>
                          <Button size="sm" variant="primary" disabled={savingId === r.id} onClick={() => saveEdit(r.id)}>
                            {savingId === r.id ? 'Sparar...' : 'Spara'}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={cancelEdit}>Avbryt</Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline-primary" onClick={() => startEdit(r)}>Redigera</Button>
                          <Button size="sm" variant="danger" disabled={deletingId === r.id} onClick={() => deleteRow(r.id)}>
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

