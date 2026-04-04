// Electrobun frontend entry point
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MainLayout } from '../ui/main-layout';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<MainLayout />);
}
