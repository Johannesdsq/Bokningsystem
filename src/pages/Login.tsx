import { useState } from 'react';
import { useLocation, useNavigate, Navigate, Link } from 'react-router-dom';
import { Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

Login.route = {
  path: '/login',
  index: 0
};

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string })?.from ?? '/';

  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  const set = (key: 'email' | 'password', value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message ?? 'Misslyckad inloggning');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Row>
      <Col md={6} lg={5} xl={4}>
        <h2>Logga in</h2>
        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        <Form onSubmit={handleSubmit} className="mt-3">
          <Form.Group className="mb-3">
            <Form.Label>E-post</Form.Label>
            <Form.Control
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              disabled={submitting || loading}
              required
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Lösenord</Form.Label>
            <Form.Control
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              disabled={submitting || loading}
              required
            />
          </Form.Group>

          <Button type="submit" disabled={submitting || loading}>
            {submitting || loading ? <><Spinner size="sm" className="me-2" /> Loggar in...</> : 'Logga in'}
          </Button>
        </Form>
        <p className="mt-3 mb-0">
          Har du inget konto? <Link to="/registrera">Registrera dig här</Link>.
        </p>
      </Col>
    </Row>
  );
}
