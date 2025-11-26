import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DEFAULT_DOCUMENT, DEFAULT_COLLECTION, VISIBILITY_TYPES } from '../types';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

const DocumentContext = createContext();

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within DocumentProvider');
  }
  return context;
};

// Collection names following naming convention: {moduleName}_{collectionName}
const DOCUMENTS_COLLECTION = 'documentation_documents';
const COLLECTIONS_COLLECTION = 'documentation_collections';

export const DocumentProvider = ({ children }) => {
  const [documents, setDocuments] = useState([]);
  const [collections, setCollections] = useState([]);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [currentCollection, setCurrentCollection] = useState(null);
  const [loading, setLoading] = useState(true);

  // Real-time listener for documents
  useEffect(() => {
    if (!db) {
      console.log('Firebase not configured, using local state only');
      setLoading(false);
      return;
    }

    try {
      const documentsRef = collection(db, DOCUMENTS_COLLECTION);
      const q = query(documentsRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = [];
        snapshot.forEach((doc) => {
          docs.push({ id: doc.id, ...doc.data() });
        });
        setDocuments(docs);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching documents:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up documents listener:', error);
      setLoading(false);
    }
  }, []);

  // Real-time listener for collections
  useEffect(() => {
    if (!db) {
      return;
    }

    try {
      const collectionsRef = collection(db, COLLECTIONS_COLLECTION);
      const q = query(collectionsRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const cols = [];
        snapshot.forEach((doc) => {
          cols.push({ id: doc.id, ...doc.data() });
        });
        setCollections(cols);
      }, (error) => {
        console.error('Error fetching collections:', error);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up collections listener:', error);
    }
  }, []);

  // Generate unique ID for local storage
  const generateId = () => `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create new document
  const createDocument = useCallback(async (parentId = null, collectionId = null) => {
    const newDoc = {
      ...DEFAULT_DOCUMENT,
      parentId,
      collectionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user',
      order: documents.length
    };

    if (!db) {
      // Local state only
      newDoc.id = generateId();
      setDocuments(prev => [...prev, newDoc]);
      setCurrentDocument(newDoc);
      return newDoc;
    }

    try {
      const documentsRef = collection(db, DOCUMENTS_COLLECTION);
      delete newDoc.id;
      const firebaseDoc = {
        ...newDoc,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(documentsRef, firebaseDoc);
      const createdDoc = { id: docRef.id, ...newDoc };
      setCurrentDocument(createdDoc);
      return createdDoc;
    } catch (error) {
      console.error('Error creating document:', error);
      // Fallback to local
      newDoc.id = generateId();
      setDocuments(prev => [...prev, newDoc]);
      setCurrentDocument(newDoc);
      return newDoc;
    }
  }, [documents.length]);

  // Update document
  const updateDocument = useCallback(async (id, updates) => {
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (!db) {
      // Local state only
      setDocuments(prev => prev.map(doc =>
        doc.id === id ? { ...doc, ...updatedData } : doc
      ));
      if (currentDocument?.id === id) {
        setCurrentDocument(prev => ({ ...prev, ...updatedData }));
      }
      return;
    }

    try {
      const docRef = doc(db, DOCUMENTS_COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      if (currentDocument?.id === id) {
        setCurrentDocument(prev => ({ ...prev, ...updatedData }));
      }
    } catch (error) {
      console.error('Error updating document:', error);
      // Fallback to local
      setDocuments(prev => prev.map(doc =>
        doc.id === id ? { ...doc, ...updatedData } : doc
      ));
      if (currentDocument?.id === id) {
        setCurrentDocument(prev => ({ ...prev, ...updatedData }));
      }
    }
  }, [currentDocument]);

  // Delete document
  const deleteDocument = useCallback(async (id) => {
    const deleteRecursiveLocal = (docId) => {
      const children = documents.filter(doc => doc.parentId === docId);
      children.forEach(child => deleteRecursiveLocal(child.id));
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
    };

    if (!db) {
      // Local state only
      deleteRecursiveLocal(id);
      if (currentDocument?.id === id) {
        setCurrentDocument(null);
      }
      return;
    }

    try {
      const deleteRecursive = async (docId) => {
        const children = documents.filter(doc => doc.parentId === docId);
        for (const child of children) {
          await deleteRecursive(child.id);
        }
        const docRef = doc(db, DOCUMENTS_COLLECTION, docId);
        await deleteDoc(docRef);
      };

      await deleteRecursive(id);

      if (currentDocument?.id === id) {
        setCurrentDocument(null);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      // Fallback to local
      deleteRecursiveLocal(id);
      if (currentDocument?.id === id) {
        setCurrentDocument(null);
      }
    }
  }, [documents, currentDocument]);

  // Create collection
  const createCollection = useCallback(async () => {
    const newCollection = {
      ...DEFAULT_COLLECTION,
      createdAt: new Date().toISOString()
    };

    if (!db) {
      // Local state only
      newCollection.id = generateId();
      setCollections(prev => [...prev, newCollection]);
      return newCollection;
    }

    try {
      const collectionsRef = collection(db, COLLECTIONS_COLLECTION);
      delete newCollection.id;
      const firebaseCollection = {
        ...newCollection,
        createdAt: serverTimestamp()
      };

      const collectionRef = await addDoc(collectionsRef, firebaseCollection);
      const createdCollection = { id: collectionRef.id, ...newCollection };
      return createdCollection;
    } catch (error) {
      console.error('Error creating collection:', error);
      // Fallback to local
      newCollection.id = generateId();
      setCollections(prev => [...prev, newCollection]);
      return newCollection;
    }
  }, []);

  // Update collection
  const updateCollection = useCallback(async (id, updates) => {
    if (!db) {
      // Local state only
      setCollections(prev => prev.map(col =>
        col.id === id ? { ...col, ...updates } : col
      ));
      return;
    }

    try {
      const collectionRef = doc(db, COLLECTIONS_COLLECTION, id);
      await updateDoc(collectionRef, updates);
    } catch (error) {
      console.error('Error updating collection:', error);
      // Fallback to local
      setCollections(prev => prev.map(col =>
        col.id === id ? { ...col, ...updates } : col
      ));
    }
  }, []);

  // Delete collection
  const deleteCollection = useCallback(async (id) => {
    const deleteLocal = () => {
      setDocuments(prev => prev.filter(doc => doc.collectionId !== id));
      setCollections(prev => prev.filter(col => col.id !== id));
    };

    if (!db) {
      // Local state only
      deleteLocal();
      if (currentCollection?.id === id) {
        setCurrentCollection(null);
      }
      return;
    }

    try {
      // Delete all documents in the collection first
      const docsInCollection = documents.filter(doc => doc.collectionId === id);
      for (const document of docsInCollection) {
        await deleteDocument(document.id);
      }

      // Then delete the collection
      const collectionRef = doc(db, COLLECTIONS_COLLECTION, id);
      await deleteDoc(collectionRef);

      if (currentCollection?.id === id) {
        setCurrentCollection(null);
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
      // Fallback to local
      deleteLocal();
      if (currentCollection?.id === id) {
        setCurrentCollection(null);
      }
    }
  }, [documents, currentCollection, deleteDocument]);

  // Share document
  const shareDocument = useCallback((id, userIds, visibility = VISIBILITY_TYPES.SHARED) => {
    updateDocument(id, {
      visibility,
      sharedWith: userIds
    });
  }, [updateDocument]);

  // Get document hierarchy (children)
  const getDocumentChildren = useCallback((parentId) => {
    return documents
      .filter(doc => doc.parentId === parentId)
      .sort((a, b) => a.order - b.order);
  }, [documents]);

  // Get root documents (no parent)
  const getRootDocuments = useCallback((collectionId = null) => {
    return documents
      .filter(doc => doc.parentId === null && doc.collectionId === collectionId)
      .sort((a, b) => a.order - b.order);
  }, [documents]);

  // Get documents by collection
  const getCollectionDocuments = useCallback((collectionId) => {
    return documents
      .filter(doc => doc.collectionId === collectionId)
      .sort((a, b) => a.order - b.order);
  }, [documents]);

  const value = {
    documents,
    collections,
    currentDocument,
    currentCollection,
    loading,
    setCurrentDocument,
    setCurrentCollection,
    createDocument,
    updateDocument,
    deleteDocument,
    createCollection,
    updateCollection,
    deleteCollection,
    shareDocument,
    getDocumentChildren,
    getRootDocuments,
    getCollectionDocuments
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};
