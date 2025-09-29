import { useEffect, useState } from 'react';
import { Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

EditBooking.route = {
  path: '/bokningar/:bookingId/redigera'
};

type BookingForm = {
  tableNumber: number;
  bookingDate: string;
  bookingTime: string;
  guests: number;
};

export default function EditBooking() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [form, setForm] = useState<BookingForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setError('Ingen bokning angiven.');
      setLoadingBooking(false);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`, {
          credentials: 'include'
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const booking = await res.json();
        if (!alive) {
          return;
        }
        let tableNumber = Number(booking.tableId);
        const tableRes = await fetch(`/api/tables/${booking.tableId}`, {
          credentials: 'include'
        });
        if (tableRes.ok) {
          const table = await tableRes.json();
          if (table?.tableNumber) {
            tableNumber = Number(table.tableNumber);
          }
        }
        setForm({
          tableNumber,
          bookingDate: booking.bookingDate,
          bookingTime: booking.bookingTime,
          guests: booking.guests
        });
      } catch (err: any) {
        if (alive) {
          setError(err?.message ?? 'Kunde inte läsa bokningen.');
        }
      } finally {
        if (alive) {
          setLoadingBooking(false);
        }
      }
    })();
    return () => { alive = false; };
  }, [bookingId]);

  if (loading) {
    return <Row><Col><Spinner size="sm" className="me-2" /> Laddar...</Col></Row>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (loadingBooking) {
    return <Row><Col><Spinner size="sm" className="me-2" /> Laddar bokning...</Col></Row>;
  }

  if (!form) {
    return <Row><Col><Alert variant="danger">{error ?? 'Kunde inte läsa bokningen.'}</Alert></Col></Row>;
  }

  const set = (key: keyof BookingForm, value: any) => setForm({ ...form, [key]: value });

  const getOrCreateTableId = async (tableNumber: number): Promise<number> => {
    const query = await fetch(`/api/tables?where=tableNumber=${tableNumber}&limit=1`, {
      credentials: 'include'
    });
    if (!query.ok) {
      throw new Error(`HTTP ${query.status}`);
    }
    const arr = await query.json();
    if (Array.isArray(arr) && arr.length > 0) {
      return Number(arr[0]?.id);
    }
    if (user.role !== 'admin') {
      throw new Error('Bordet finns inte. Kontakta personalen.');
    }
    const create = await fetch('/api/tables', {
      method: 'POST',
      credentials: 'include',
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
    return Number(created?.insertId);
  };

  const submitHandler = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!bookingId) {
      setError('Ingen bokning angiven.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const tableNumber = Number(form.tableNumber);
      const tableId = await getOrCreateTableId(tableNumber);
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        credentials: 'include',
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
      setError(err?.message ?? 'Misslyckades att uppdatera bokningen.');
    } finally {
      setSaving(false);
    }
  };

  return <Row>
    <Col md={8} lg={6} xl={5}>
      <h2>Redigera bokning</h2>
      {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
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
          <Form.Text muted>Ändra bordsnummer om bokningen ska flyttas.</Form.Text>
        </Form.Group>

        <div className="d-flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? <><Spinner size="sm" className="me-2" /> Uppdaterar...</> : 'Spara ändringar'}
          </Button>
          <Button variant="secondary" type="button" onClick={() => navigate('/bokningar')}>Avbryt</Button>
        </div>
      </Form>
    </Col>
  </Row>;
}
