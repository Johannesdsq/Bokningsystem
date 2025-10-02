import { Row, Col } from 'react-bootstrap';

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
        En modern kvarterskrog med fokus på säsongsbetonade råvaror, vällagad husman
        och varma möten. Boka bord och upplev vår meny i hjärtat av staden.
      </p>
    </Col>
  </Row>
}
