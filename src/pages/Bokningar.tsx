import { useEffect, useState } from 'react';
import { Row, Col, Table, Spinner, Alert, Button } from 'react-bootstrap';

Bokningar.route = {
  path: '/bokningar',
  menuLabel: 'Bokningar',
  index: 3
}

export default function Bokningar() {
  type Booking = {
    id: number;
    userId: number;
    tableId: number;
    bookingDate: string;
    bookingTime: string;
    guests: number;
    status: string;
    created: string;
  };

  const [data, setData] = useState<Booking[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/bookings');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (alive) setData(json);
      } catch (e: any) {
        if (alive) setError(e?.message || 'Okänt fel');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  async function cancelBooking(id: number) {
    if (!data) return;
    if (!confirm('Vill du avboka denna bokning?')) return;
    setDeleting(id);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(data.filter(b => b.id !== id));
    } catch (e: any) {
      setError(e?.message || 'Okänt fel');
    } finally {
      setDeleting(null);
    }
  }

  return <Row>
    <Col>
      <h2>Bokningar</h2>
      {loading && <div className="d-flex align-items-center gap-2"><Spinner size="sm" /> <span>Laddar...</span></div>}
      {error && <Alert variant="danger">Kunde inte hämta bokningar: {error}</Alert>}
      {data && (
        <Table striped hover responsive className="mt-3">
          <thead>
            <tr>
              <th>Bord</th>
              <th>Datum</th>
              <th>Tid</th>
              <th>Gäster</th>
              <th>Status</th>
              <th>Skapad</th>
              <th>Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            {data.map(b => (
              <tr key={b.id}>
                <td>{b.tableId}</td>
                <td>{b.bookingDate}</td>
                <td>{b.bookingTime}</td>
                <td>{b.guests}</td>
                <td>{b.status}</td>
                <td>{new Date(b.created).toLocaleString()}</td>
                <td>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={deleting === b.id}
                    onClick={() => cancelBooking(b.id)}
                  >{deleting === b.id ? 'Avbokar...' : 'Avboka'}</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Col>
  </Row>
}
