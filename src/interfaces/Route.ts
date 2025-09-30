import type { JSX } from 'react';

export default interface Route {
  element: JSX.Element;
  path: string;
  loader?: Function;
  menuLabel?: string;
  index?: number;
  parent?: string;
  // Optional: restrict menu visibility to a role
  requiresRole?: 'admin' | 'user';
}
