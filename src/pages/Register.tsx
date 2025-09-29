import { useState } from 'react';
import { Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

Register.route = {
  path: '/registrera',
  index: 0
};

type RegisterForm = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirm: string;
};

export default function Register() {
  const { user, loading, register } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterForm>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirm: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    const from = (location.state as { from?: string })?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  const set = <K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.password.trim().length < 6) {
      setError('Lösenordet behöver minst 6 tecken.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Lösenorden matchar inte.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await register({
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        password: form.password
      });
      const from = (location.state as { from?: string })?.from ?? '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message ?? 'Misslyckad registrering');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Row>
      <Col md={6} lg={5} xl={4}>
        <h2>Registrera konto</h2>
        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        <Form onSubmit={handleSubmit} className="mt-3">
          <Form.Group className="mb-3">
            <Form.Label>Förnamn</Form.Label>
            <Form.Control
              value={form.firstName}
              onChange={e => set('firstName', e.target.value)}
              disabled={submitting || loading}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Efternamn</Form.Label>
            <Form.Control
              value={form.lastName}
              onChange={e => set('lastName', e.target.value)}
              disabled={submitting || loading}
              required
            />
          </Form.Group>
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
          <Form.Group className="mb-3">
            <Form.Label>Lösenord</Form.Label>
            <Form.Control
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              disabled={submitting || loading}
              required
            />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label>Upprepa lösenord</Form.Label>
            <Form.Control
              type="password"
              value={form.confirm}
              onChange={e => set('confirm', e.target.value)}
              disabled={submitting || loading}
              required
            />
          </Form.Group>
          <Button type="submit" disabled={submitting || loading}>
            {submitting || loading ? <><Spinner size="sm" className="me-2" /> Registrerar...</> : 'Skapa konto'}
          </Button>
        </Form>
        <p className="mt-3 mb-0">
          Har du redan ett konto? <Link to="/login">Logga in här</Link>.
        </p>
      </Col>
    </Row>
  );
}
