import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TableView from './components/TableView';
import PivotView from './components/PivotView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/pivot" element={<PivotView />} />
        <Route path="/" element={<TableView />} />
      </Routes>
    </Router>
  );
}

export default App;
