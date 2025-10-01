import { useEffect, useMemo, useState } from 'react';
import { Row, Col, Table, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type SlotRow = { id: number; time: string };

AdminSlots.route = {
  path: '/admin/tider',
  menuLabel: 'Tider',
  index: 100,
  parent: '/admin',
  requiresRole: 'admin' as const
};

export default function AdminSlots() {
  const { user, loading } = useAuth();
  const location = useLocation();

  const [rows, setRows] = useState<SlotRow[] | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newTime, setNewTime] = useState('17:00');
  const [savingNew, setSavingNew] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTime, setEditTime] = useState<string>('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const isAdmin = useMemo(() => !loading && !!user && user.role === 'admin', [user, loading]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setFetching(true);
      setError(null);
      try {
        const res = await fetch('/api/time_slots?orderBy=time', { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const list: SlotRow[] = await res.json();
        if (alive) setRows(list);
      } catch (e: any) {
        if (alive) setError(e?.message ?? 'Kunde inte hämta tider.');
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

  async function createSlot(e: React.FormEvent) {
    e.preventDefault();
    setSavingNew(true);
    setError(null);
    try {
      const time = (newTime || '').slice(0, 5);
      const res = await fetch('/api/time_slots', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error((json as any)?.error || `HTTP ${res.status}`);
      const insertId = Number((json as any)?.insertId);
      setRows([...(rows ?? []), { id: insertId, time }].sort((a, b) => a.time.localeCompare(b.time)));
      setNewTime('');
    } catch (e: any) {
      setError(e?.message ?? 'Misslyckades att skapa tid.');
    } finally {
      setSavingNew(false);
    }
  }

  function startEdit(row: SlotRow) {
    setEditingId(row.id);
    setEditTime(row.time);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTime('');
  }

  async function saveEdit(id: number) {
    setSavingId(id);
    setError(null);
    try {
      const time = (editTime || '').slice(0, 5);
      const res = await fetch(`/api/time_slots/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error((json as any)?.error || `HTTP ${res.status}`);
      setRows((rows ?? []).map(r => r.id === id ? { ...r, time } : r).sort((a, b) => a.time.localeCompare(b.time)));
      cancelEdit();
    } catch (e: any) {
      setError(e?.message ?? 'Misslyckades att uppdatera tid.');
    } finally {
      setSavingId(null);
    }
  }

  async function deleteRow(id: number) {
    if (!confirm('Ta bort denna tid?')) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/time_slots/${id}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error((json as any)?.error || `HTTP ${res.status}`);
      setRows((rows ?? []).filter(r => r.id !== id));
    } catch (e: any) {
      setError(e?.message ?? 'Misslyckades att ta bort tid.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Row>
      <Col>
        <h2>Admin: Tider</h2>
        {error && <Alert variant='danger' className='mt-2'>{error}</Alert>}

        <Form onSubmit={createSlot} className='mt-3 border rounded p-3'>
          <h5 className='mb-3'>Lägg till tid</h5>
          <div className='d-flex align-items-end gap-2 flex-wrap'>
            <Form.Group>
              <Form.Label className='mb-1'>Tid</Form.Label>
              <Form.Control type='time' value={newTime} onChange={e => setNewTime(e.target.value)} required />
            </Form.Group>
            <Button type='submit' disabled={savingNew}>
              {savingNew ? <><Spinner size='sm' className='me-2' /> Sparar...</> : 'Lägg till'}
            </Button>
          </div>
        </Form>

        <div className='mt-4'>
          {fetching ? (
            <div className='d-flex align-items-center gap-2'><Spinner size='sm' /> <span>Laddar tider...</span></div>
          ) : !rows || rows.length === 0 ? (
            <Alert variant='info'>Inga tider ännu.</Alert>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Tid</th>
                  <th>Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td style={{ width: 200 }}>
                      {editingId === r.id ? (
                        <Form.Control type='time' value={editTime} onChange={e => setEditTime(e.target.value)} />
                      ) : (
                        r.time
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

