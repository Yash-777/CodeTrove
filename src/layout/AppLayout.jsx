/**
 * src/layout/AppLayout.jsx
 * ------------------------------------------------------------------
 * The shared shell for every page: Header on top, Sidebar on the
 * left, page content on the right via <Outlet/> (react-router-dom's
 * "render whichever nested route matched, right here" placeholder).
 *
 * The sidebar's open/closed state lives HERE (not inside Sidebar
 * itself), because the Header needs to render the toggle button that
 * controls it - "lifting state up" to the nearest common parent is a
 * standard React pattern whenever two sibling components need to
 * share one piece of state.
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import './AppLayout.css';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="app-shell">
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className="app-body">
        <Sidebar open={sidebarOpen} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
