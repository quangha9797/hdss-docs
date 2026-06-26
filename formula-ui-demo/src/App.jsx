import React from 'react';
import FormulaEditorMockup from './FormulaEditorMockup';

function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <header style={{ backgroundColor: '#2d3436', color: 'white', padding: '1rem 2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Credit Limit Engine - Admin Dashboard</h1>
      </header>
      <main style={{ padding: '2rem' }}>
        <FormulaEditorMockup />
      </main>
    </div>
  );
}

export default App;
