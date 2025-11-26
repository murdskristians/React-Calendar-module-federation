import React from 'react';
import { DocumentProvider } from './context/DocumentContext';
import DocumentSidebar from './components/DocumentSidebar';
import DocumentViewer from './components/DocumentViewer';
import './App.css';

function App() {
  return (
    <DocumentProvider>
      <div className="app-container">
        <DocumentSidebar />
        <DocumentViewer />
      </div>
    </DocumentProvider>
  );
}

export default App;
