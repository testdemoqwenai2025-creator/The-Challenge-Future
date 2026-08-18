'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { HeaderBar } from './HeaderBar';
import { DashboardGrid } from './DashboardGrid';

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <HeaderBar />
        <div className="flex-1 overflow-auto p-6 scrollbar-thin">
          <DashboardGrid />
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {/* Could add Sheet-based mobile sidebar here */}
    </div>
  );
}
