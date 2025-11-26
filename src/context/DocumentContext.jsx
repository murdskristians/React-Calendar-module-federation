import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
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

export const DocumentProvider = ({ children, currentUserId = 'default-user' }) => {
  const [allDocuments, setAllDocuments] = useState([]);
  const [allCollections, setAllCollections] = useState([]);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [currentCollection, setCurrentCollection] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter documents based on visibility and ownership
  const documents = useMemo(() => {
    console.log('Current User ID:', currentUserId);
    const filtered = allDocuments.filter(doc => {
      console.log('Document:', doc.id, 'visibility:', doc.visibility, 'createdBy:', doc.createdBy);

      // Public documents are visible to everyone
      if (doc.visibility === VISIBILITY_TYPES.PUBLIC) {
        return true;
      }

      // Private documents only visible to creator
      // If createdBy is missing, treat as private to current user for backward compatibility
      if (doc.visibility === VISIBILITY_TYPES.PRIVATE || !doc.visibility) {
        return doc.createdBy === currentUserId;
      }

      return false;
    });
    console.log('Filtered documents:', filtered.length, 'of', allDocuments.length);
    return filtered;
  }, [allDocuments, currentUserId]);

  // Filter collections based on visibility and ownership
  const collections = useMemo(() => {
    return allCollections.filter(col => {
      // Public collections are visible to everyone
      if (col.visibility === VISIBILITY_TYPES.PUBLIC) {
        return true;
      }

      // Private collections only visible to creator
      if (col.visibility === VISIBILITY_TYPES.PRIVATE || !col.visibility) {
        return col.createdBy === currentUserId;
      }

      return false;
    });
  }, [allCollections, currentUserId]);

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
        setAllDocuments(docs);
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
        setAllCollections(cols);
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
      createdBy: currentUserId,
      order: allDocuments.length
    };

    if (!db) {
      // Local state only
      newDoc.id = generateId();
      setAllDocuments(prev => [...prev, newDoc]);
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
      setAllDocuments(prev => [...prev, newDoc]);
      setCurrentDocument(newDoc);
      return newDoc;
    }
  }, [allDocuments.length, currentUserId]);

  // Update document
  const updateDocument = useCallback(async (id, updates) => {
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (!db) {
      // Local state only
      setAllDocuments(prev => prev.map(doc =>
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
      setAllDocuments(prev => prev.map(doc =>
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
      const children = allDocuments.filter(doc => doc.parentId === docId);
      children.forEach(child => deleteRecursiveLocal(child.id));
      setAllDocuments(prev => prev.filter(doc => doc.id !== docId));
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
        const children = allDocuments.filter(doc => doc.parentId === docId);
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
  }, [allDocuments, currentDocument]);

  // Create collection
  const createCollection = useCallback(async () => {
    const newCollection = {
      ...DEFAULT_COLLECTION,
      createdAt: new Date().toISOString(),
      createdBy: currentUserId
    };

    if (!db) {
      // Local state only
      newCollection.id = generateId();
      setAllCollections(prev => [...prev, newCollection]);
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
      setAllCollections(prev => [...prev, newCollection]);
      return newCollection;
    }
  }, [currentUserId]);

  // Update collection
  const updateCollection = useCallback(async (id, updates) => {
    if (!db) {
      // Local state only
      setAllCollections(prev => prev.map(col =>
        col.id === id ? { ...col, ...updates } : col
      ));
      if (currentCollection?.id === id) {
        setCurrentCollection(prev => ({ ...prev, ...updates }));
      }
      return;
    }

    try {
      const collectionRef = doc(db, COLLECTIONS_COLLECTION, id);
      await updateDoc(collectionRef, updates);

      if (currentCollection?.id === id) {
        setCurrentCollection(prev => ({ ...prev, ...updates }));
      }
    } catch (error) {
      console.error('Error updating collection:', error);
      // Fallback to local
      setAllCollections(prev => prev.map(col =>
        col.id === id ? { ...col, ...updates } : col
      ));
      if (currentCollection?.id === id) {
        setCurrentCollection(prev => ({ ...prev, ...updates }));
      }
    }
  }, [currentCollection]);

  // Delete collection
  const deleteCollection = useCallback(async (id) => {
    const deleteLocal = () => {
      setAllDocuments(prev => prev.filter(doc => doc.collectionId !== id));
      setAllCollections(prev => prev.filter(col => col.id !== id));
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
      const docsInCollection = allDocuments.filter(doc => doc.collectionId === id);
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
  }, [allDocuments, currentCollection, deleteDocument]);


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
