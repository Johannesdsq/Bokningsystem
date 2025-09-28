import { useState } from 'react';
import { Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

Boka.route = {
  path: '/boka',
  menuLabel: 'Boka bord',
  index: 2
}

type BookingInput = {
  userId: number;
  tableId: number;
  bookingDate: string; // YYYY-MM-DD
  bookingTime: string; // HH:mm
  guests: number;
  status: string;
};

export default function Boka() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  const defaultDate = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const [form, setForm] = useState<BookingInput>({
    // Use an existing sample user from the seed DB
    userId: 7,
    tableId: 1,
    bookingDate: defaultDate,
    bookingTime: '18:00',
    guests: 2,
    // Status must satisfy DB constraint: 'booked' or 'cancelled'
    status: 'booked'
  });

  const set = (k: keyof BookingInput, v: any) => setForm({ ...form, [k]: v });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // On success, go to list of bookings
      navigate('/bokningar');
    } catch (err: any) {
      setError(err?.message || 'Okänt fel');
    } finally {
      setSaving(false);
    }
  }

  // Handler that allows any typed bordsnummer by resolving/creating a table row
  async function submitHandler(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const tableNumber = Number(form.tableId);
      let tableId: number | null = null;
      const q = await fetch(`/api/tables?where=tableNumber=${tableNumber}&limit=1`);
      if (!q.ok) throw new Error(`HTTP ${q.status}`);
      const arr = await q.json();
      if (Array.isArray(arr) && arr.length > 0) {
        tableId = Number(arr[0]?.id);
      }
      if (!tableId) {
        const create = await fetch('/api/tables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableNumber, seats: Math.max(2, Number(form.guests) || 2) })
        });
        if (!create.ok) throw new Error(`HTTP ${create.status}`);
        const created = await create.json();
        tableId = Number(created?.insertId);
      }
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tableId })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      navigate('/bokningar');
    } catch (err: any) {
      setError(err?.message || 'Ok��nt fel');
    } finally {
      setSaving(false);
    }
  }

  return <Row>
    <Col md={8} lg={6} xl={5}>
      <h2>Boka bord</h2>
      {error && <Alert variant="danger" className="mt-2">Kunde inte spara: {error}</Alert>}
      <Form onSubmit={submitHandler} className="mt-3">
        <Form.Group className="mb-3">
          <Form.Label>Datum</Form.Label>
          <Form.Control type="date" value={form.bookingDate}
            onChange={e => set('bookingDate', e.target.value)} required />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Tid</Form.Label>
          <Form.Control type="time" value={form.bookingTime}
            onChange={e => set('bookingTime', e.target.value)} required />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Gäster</Form.Label>
          <Form.Control type="number" min={1} max={20} value={form.guests}
            onChange={e => set('guests', Number(e.target.value))} required />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Bord</Form.Label>
          <Form.Control type="number" min={1} value={form.tableId}
            onChange={e => set('tableId', Number(e.target.value))} required />
          <Form.Text muted>Enkel modell: ange bordsnummer.</Form.Text>
        </Form.Group>

        <div className="d-flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? <><Spinner size="sm" /> Sparar…</> : 'Boka'}
          </Button>
          <Button variant="secondary" type="button" onClick={() => navigate('/bokningar')}>Avbryt</Button>
        </div>
      </Form>
    </Col>
  </Row>;
}
