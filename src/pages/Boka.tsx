import { useState } from 'react';
import { Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

Boka.route = {
  path: '/boka',
  menuLabel: 'Boka bord',
  index: 2
};

type BookingForm = {
  tableNumber: number;
  bookingDate: string; // YYYY-MM-DD
  bookingTime: string; // HH:mm
  guests: number;
};

export default function Boka() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  const defaultDate = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const [form, setForm] = useState<BookingForm>({
    tableNumber: 1,
    bookingDate: defaultDate,
    bookingTime: '18:00',
    guests: 2
  });

  const set = (k: keyof BookingForm, v: any) => setForm({ ...form, [k]: v });

  if (loading) {
    return <Row><Col><Spinner size="sm" className="me-2" /> Laddar...</Col></Row>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const tableNumber = Number(form.tableNumber);
      let tableId: number | null = null;
      const query = await fetch(`/api/tables?where=tableNumber=${tableNumber}&limit=1`);
      if (!query.ok) {
        throw new Error(`HTTP ${query.status}`);
      }
      const arr = await query.json();
      if (Array.isArray(arr) && arr.length > 0) {
        tableId = Number(arr[0]?.id);
      }
      if (!tableId) {
        if (user.role === 'admin') {
          const create = await fetch('/api/tables', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tableNumber,
              seats: Math.max(2, Number(form.guests) || 2)
            })
          });
          if (!create.ok) {
            throw new Error(`HTTP ${create.status}`);
          }
          const created = await create.json();
          tableId = Number(created?.insertId);
        } else {
          throw new Error('Bordet finns inte. Kontakta personalen.');
        }
      }
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          bookingDate: form.bookingDate,
          bookingTime: form.bookingTime,
          guests: form.guests,
          status: 'booked'
        })
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      navigate('/bokningar');
    } catch (err: any) {
      setError(err?.message || 'Okänt fel');
    } finally {
      setSaving(false);
    }
  };

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
          <Form.Control type="number" min={1} value={form.tableNumber}
            onChange={e => set('tableNumber', Number(e.target.value))} required />
          <Form.Text muted>Enkel modell: ange bordsnummer.</Form.Text>
        </Form.Group>

        <div className="d-flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? <><Spinner size="sm" className="me-2" /> Sparar...</> : 'Boka'}
          </Button>
          <Button variant="secondary" type="button" onClick={() => navigate('/bokningar')}>Avbryt</Button>
        </div>
      </Form>
    </Col>
  </Row>;
}
