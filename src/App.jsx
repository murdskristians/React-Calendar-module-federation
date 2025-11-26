import React from 'react';
import { DocumentProvider } from './context/DocumentContext';
import DocumentSidebar from './components/DocumentSidebar';
import DocumentViewer from './components/DocumentViewer';
import './App.css';

function App({ userId }) {
  // userId is passed from the host application via Module Federation
  // For standalone development, it defaults to 'default-user' in DocumentProvider
  console.log('[Documentation Module] App loaded with userId:', userId);
  return (
    <DocumentProvider currentUserId={userId}>
      <div className="app-container">
        <DocumentSidebar />
        <DocumentViewer />
      </div>
    </DocumentProvider>
  );
}

export default App;
