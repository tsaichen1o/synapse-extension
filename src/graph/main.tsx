// src/graph/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import GraphApp from './GraphApp'; // Graph application component
import '../sidepanel/index.css'; // Import Tailwind CSS

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <GraphApp />
    </React.StrictMode>,
);