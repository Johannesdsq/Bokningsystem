import { useEffect, useState } from 'react';
import { Row, Col, Table, Spinner, Alert } from 'react-bootstrap';

type MenuItem = {
  id: number;
  name: string;
  price: number;
  description?: string;
};

Meny.route = {
  path: '/meny',
  menuLabel: 'Meny',
  index: 5
};

export default function Meny() {
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/menu_items?orderBy=name', { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const list: MenuItem[] = await res.json();
        if (alive) setItems(list);
      } catch (e: any) {
        if (alive) setError(e?.message ?? 'Kunde inte hämta menyn.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <Row>
      <Col>
        <h2>Meny</h2>
        {loading && <div className='d-flex align-items-center gap-2'><Spinner size='sm' /> <span>Laddar...</span></div>}
        {error && <Alert variant='danger' className='mt-3'>{error}</Alert>}
        {!loading && !error && (!items || items.length === 0) && (
          <Alert variant='info' className='mt-3'>Inga rätter i menyn ännu.</Alert>
        )}
        {!loading && !error && items && items.length > 0 && (
          <Table striped hover responsive className='mt-3'>
            <thead>
              <tr>
                <th>Namn</th>
                <th>Pris</th>
                <th>Beskrivning</th>
              </tr>
            </thead>
            <tbody>
              {items.map(x => (
                <tr key={x.id}>
                  <td>{x.name}</td>
                  <td>{x.price}</td>
                  <td>{x.description}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Col>
    </Row>
  );
}

