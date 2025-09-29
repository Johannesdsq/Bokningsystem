import { useEffect, useMemo, useState } from 'react';
import { Row, Col, Form, Table, Spinner, Alert, Badge } from 'react-bootstrap';

Tillganglighet.route = {
  path: '/tillganglighet',
  menuLabel: 'Tillgänglighet',
  index: 2
};

type TableInfo = {
  id: number;
  tableNumber: number;
  seats: number;
  description?: string;
};

type BookingInfo = {
  id: number;
  tableId: number;
  bookingTime: string;
  status: string;
};

type AvailabilityResponse = {
  date: string;
  slots: string[];
  tables: TableInfo[];
  bookings: BookingInfo[];
};

const defaultSlots = ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

export default function Tillganglighet() {
  const today = new Date();
  const formatDate = (d: Date) => {
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(formatDate(today));
  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/availability?date=${selectedDate}`, {
          credentials: 'include'
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        if (alive) {
          setData(json);
        }
      } catch (err: any) {
        if (alive) {
          setError(err?.message ?? 'Kunde inte hämta tillgänglighet.');
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();
    return () => { alive = false; };
  }, [selectedDate]);

  const slots = useMemo(() => {
    const apiSlots = data?.slots ?? [];
    const bookingSlots = data?.bookings?.map(b => (b.bookingTime || '').slice(0, 5)) ?? [];
    return Array.from(new Set([...defaultSlots, ...apiSlots, ...bookingSlots]))
      .filter(Boolean)
      .sort();
  }, [data]);

  const availability = useMemo(() => {
    if (!data) {
      return [] as { table: TableInfo; slots: { time: string; booked: boolean }[] }[];
    }
    return data.tables.map(table => {
      const slotStatus = slots.map(time => {
        const booking = data.bookings.find(b => b.tableId === table.id && (b.bookingTime || '').startsWith(time));
        const booked = Boolean(booking && booking.status === 'booked');
        return { time, booked };
      });
      return { table, slots: slotStatus };
    });
  }, [data, slots]);

  return (
    <Row>
      <Col>
        <h2>Tillgänglighet</h2>
        <p className='text-muted'>Välj datum för att se vilka bord som är lediga eller upptagna.</p>

        <Form className='mb-3'>
          <Form.Group controlId='availability-date' className='d-inline-flex align-items-center gap-2'>
            <Form.Label className='mb-0'>Datum</Form.Label>
            <Form.Control
              type='date'
              value={selectedDate}
              min={formatDate(today)}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ maxWidth: 220 }}
            />
          </Form.Group>
        </Form>

        {loading && <div className='d-flex align-items-center gap-2'><Spinner size='sm' /> <span>Laddar...</span></div>}
        {error && <Alert variant='danger' className='mt-3'>{error}</Alert>}

        {!loading && !error && availability.length === 0 && (
          <Alert variant='info' className='mt-3'>Inga bord hittades för valt datum.</Alert>
        )}

        {!loading && !error && availability.length > 0 && (
          <div className='table-responsive'>
            <Table bordered hover className='align-middle'>
              <thead>
                <tr>
                  <th>Bord</th>
                  <th>Platser</th>
                  {slots.map(slot => <th key={slot}>{slot}</th>)}
                </tr>
              </thead>
              <tbody>
                {availability.map(({ table, slots: slotStatuses }) => (
                  <tr key={table.id}>
                    <td>
                      <div className='fw-semibold'>Bord {table.tableNumber}</div>
                      {table.description ? <div className='text-muted small'>{table.description}</div> : null}
                    </td>
                    <td>{table.seats}</td>
                    {slotStatuses.map(({ time, booked }) => (
                      <td
                        key={time}
                        className={booked ? 'bg-danger-subtle text-danger fw-semibold text-center' : 'bg-success-subtle text-success fw-semibold text-center'}
                      >
                        {booked ? 'Upptaget' : 'Ledigt'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        <div className='mt-3 d-flex align-items-center gap-3'>
          <Badge bg='success'>Ledigt</Badge>
          <Badge bg='danger'>Upptaget</Badge>
        </div>
      </Col>
    </Row>
  );
}
