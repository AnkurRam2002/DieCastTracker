import React from 'react';
import { Sidebar } from './Sidebar';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen relative">
      <Sidebar />

      {/* Main content — offset for sidebar */}
      <main className="md:pl-72 min-h-screen">
        <div className="relative z-10 p-6 md:p-10 max-w-[1600px] mx-auto pt-16 md:pt-10">
          {children}
        </div>
      </main>
    </div>
  );
};
