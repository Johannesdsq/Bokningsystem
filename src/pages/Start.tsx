import { Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

Start.route = {
  path: '/',
  menuLabel: 'Start',
  index: 1
}

export default function Start() {
  return <Row className="align-items-center g-4">
    <Col md={6}>
      <img
        src="https://cdn.thefork.com/tf-lab/image/upload/restaurant/475884cb-4560-4f26-a935-18fcf01250eb/780d6d71-2b8c-4da0-aeae-c82773f136d8.jpg"
        alt="Restaurang Johannes kök interiör"
        className="img-fluid rounded shadow-sm"
      />
    </Col>
    <Col md={6}>
      <h2>Välkommen till Johannes kök</h2>
      <p>
        En modern kvarterskrog med fokus på säsongsbetonade råvaror, vällagad mat
        och varma möten. Boka bord och upplev vår meny i hjärtat av staden.
      </p>
      <Button as={Link} to="/boka" variant="secondary">Boka bord</Button>
    </Col>

    <Col xs={12} className="mt-5"><hr /></Col>

    <Col md={4} className="mt-3">
      <h5 className="text-uppercase text-secondary">Öppettider</h5>
      <ul className="list-unstyled mb-0 small">
        <li>Mån–Tors: 11:00–22:00</li>
        <li>Fre–Lör: 11:00–23:00</li>
        <li>Sön: 12:00–21:00</li>
      </ul>
    </Col>
    <Col md={4} className="mt-3">
      <h5 className="text-uppercase text-secondary">Hitta hit & kontakt</h5>
      <address className="mb-1 small">
        Storgatan 12<br />
        111 22 Stockholm
      </address>
      <div className="small">Tel: 08‑123 45 67</div>
      <div className="small">E‑post: bokning@johanneskok.se</div>
    </Col>
    <Col md={4} className="mt-3">
      <h5 className="text-uppercase text-secondary">Signaturrätter</h5>
      <ul className="mb-0 small">
        <li>Kalventrecôte med rostad potatis och rödvinssky</li>
        <li>Smörstekt torsk med brynt smör och pepparrot</li>
        <li>Svamprisotto med lagrad ost och örter</li>
      </ul>
    </Col>

    <Col xs={12} className="mt-5">
      <blockquote className="blockquote px-3 py-3 bg-light rounded border">
        <p className="mb-0">“Fantastisk mat och varm, personlig service – vårt nya stammisställe.”</p>
        <footer className="blockquote-footer mt-1">Gästomdöme</footer>
      </blockquote>
    </Col>
  </Row>
}

