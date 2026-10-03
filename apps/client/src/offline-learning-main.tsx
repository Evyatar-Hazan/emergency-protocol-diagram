import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OfflineLearningReader } from './offlineLearning/OfflineLearningReader';
import './offlineLearning/offline-learning.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OfflineLearningReader />
  </StrictMode>,
);
