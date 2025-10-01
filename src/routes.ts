import type {JSX} from 'react';
import{createElement} from 'react';
// page components
import NotFoundPage from './pages/NotFoundPage.tsx';
import Start from './pages/Start.tsx';
import Tillganglighet from './pages/Tillganglighet.tsx';
import Boka from './pages/Boka.tsx';
import Bokningar from './pages/Bokningar.tsx';
import EditBooking from './pages/EditBooking.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import AdminTables from './pages/AdminTables.tsx';
import AdminSlots from './pages/AdminSlots.tsx';
import AdminMenu from './pages/AdminMenu.tsx';

interface Route {
  element: JSX.Element;
  path: string;
  loader?: Function;
  menuLabel?: string;
  index?: number;
  parent?: string;
}

export default [
  NotFoundPage,
  Start,
  Tillganglighet,
  Boka,
  Bokningar,
  EditBooking,
  Login,
  Register,
  AdminTables,
  AdminSlots,
  AdminMenu
]
  // map the route property of each page component to a Route
  .map(x => (({ element: createElement(x), ...x.route }) as Route))
  // sort by index (and if an item has no index, sort as index 0)
  .sort((a, b) => (a.index || 0) - (b.index || 0));
