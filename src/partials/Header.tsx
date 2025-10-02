import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Container, Nav, Navbar, Button } from 'react-bootstrap';
import routes from '../routes';
import { useAuth } from '../context/AuthContext';

export default function Header() {

  // whether the navbar is expanded or not
  // (we use this to close it after a click/selection)
  const [expanded, setExpanded] = useState(false);

  //  get the current route
  const pathName = useLocation().pathname;
  const currentRoute = routes
    .slice().sort((a, b) => a.path.length > b.path.length ? -1 : 1)
    .find(x => pathName.indexOf(x.path.split(':')[0]) === 0);
  // function that returns true if a menu item is 'active'
  const isActive = (path: string) =>
    path === currentRoute?.path || path === currentRoute?.parent;

  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setExpanded(false);
  };

  const closeMenuSoon = () => setTimeout(() => setExpanded(false), 200);

  const goTo = (path: string) => {
    closeMenuSoon();
    navigate(path);
  };

  return <header>
    <Navbar
      expanded={expanded}
      expand="md"
      className="bg-primary"
      data-bs-theme="dark"
      fixed="top"
    >
      <Container fluid>
        <Navbar.Brand className="me-5" as={Link} to="/">
          johannes kök
        </Navbar.Brand>
        <Navbar.Toggle onClick={() => setExpanded(!expanded)} />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {routes
              .filter(x => x.menuLabel)
              .filter(x => !('requiresRole' in x) || (x as any).requiresRole === undefined || (user && user.role === (x as any).requiresRole))
              .map(({ menuLabel, path }, i) => (
                <Nav.Link
                  as={Link} key={i} to={path}
                  className={isActive(path) ? 'active' : ''}
                  onClick={closeMenuSoon}
                >{menuLabel}</Nav.Link>
              ))}
          </Nav>
          <div className="d-flex align-items-center gap-2 ms-md-auto">
            {loading ? null : user ? (
              <>
                <Navbar.Text className="text-white-50 small">
                  {user.firstName} {user.lastName}
                </Navbar.Text>
                <Button
                  size="sm"
                  variant="outline-light"
                  onClick={handleLogout}
                >Logga ut</Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline-light"
                  onClick={() => goTo('/login')}
                >Logga in</Button>
                <Button
                  size="sm"
                  variant="light"
                  onClick={() => goTo('/registrera')}
                >Registrera</Button>
              </>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  </header>;
}
