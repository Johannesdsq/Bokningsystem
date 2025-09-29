import { useEffect, useState } from 'react';
import { Row, Col, Table, Spinner, Alert, Button } from 'react-bootstrap';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

Bokningar.route = {
  path: '/bokningar',
  menuLabel: 'Bokningar',
  index: 4
};

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

  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<Booking[] | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [tableNames, setTableNames] = useState<Record<number, string>>({});

  useEffect(() => {
    if (loading || !user) {
      return;
    }
    let alive = true;
    setLoadingData(true);
    (async () => {
      try {
        const res = await fetch('/api/bookings', { credentials: 'include' });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        if (alive) {
          setData(json);
        }
      } catch (e: any) {
        if (alive) {
          setError(e?.message || 'Okänt fel');
        }
      } finally {
        if (alive) {
          setLoadingData(false);
        }
      }
    })();
    return () => { alive = false; };
  }, [loading, user]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/tables', { credentials: 'include' });
        if (!res.ok) {
          return;
        }
        const list: any[] = await res.json();
        if (!alive) {
          return;
        }
        const map: Record<number, string> = {};
        list.forEach(t => { map[t.id] = String(t.tableNumber ?? t.id); });
        setTableNames(map);
      } catch {
        // ignore silently
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

  async function cancelBooking(id: number) {
    if (!data) {
      return;
    }
    if (!confirm('Vill du avboka denna bokning?')) {
      return;
    }
    setDeleting(id);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
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
      {loadingData && <div className="d-flex align-items-center gap-2"><Spinner size="sm" /> <span>Laddar...</span></div>}
      {error && <Alert variant="danger" className="mt-3">Kunde inte hämta bokningar: {error}</Alert>}
      {data && data.length === 0 && !loadingData && !error && <Alert variant="info" className="mt-3">Inga bokningar ännu.</Alert>}
      {data && data.length > 0 && (
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
                <td>{tableNames[b.tableId] ?? b.tableId}</td>
                <td>{b.bookingDate}</td>
                <td>{b.bookingTime}</td>
                <td>{b.guests}</td>
                <td>{b.status}</td>
                <td>{new Date(b.created).toLocaleString()}</td>
                <td className="d-flex gap-2">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => navigate(`/bokningar/${b.id}/redigera`)}
                  >Redigera</Button>
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
  </Row>;
}

