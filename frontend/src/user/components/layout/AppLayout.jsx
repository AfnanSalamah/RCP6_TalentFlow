import React, { useState } from 'react';
import Header from './Header';

export default function AppLayout({ children, title, subtitle }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout topbar-layout">
      <Header
        mobileOpen={mobileOpen}
        onMenuToggle={() => setMobileOpen(o => !o)}
        onClose={() => setMobileOpen(false)}
        title={title}
        subtitle={subtitle}
      />
      <div className="app-content topbar-content">
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
