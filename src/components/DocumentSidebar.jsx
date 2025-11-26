import React, { useState } from 'react';
import { useDocuments } from '../context/DocumentContext';
import {
  FaPlus,
  FaFolder,
  FaFolderOpen,
  FaFile,
  FaChevronRight,
  FaChevronDown,
  FaTrash,
  FaEdit,
  FaEllipsisV,
  FaGlobe,
  FaLock,
  FaFileAlt
} from 'react-icons/fa';

const DocumentSidebar = () => {
  const {
    collections,
    currentDocument,
    currentCollection,
    setCurrentDocument,
    setCurrentCollection,
    createDocument,
    createCollection,
    deleteDocument,
    deleteCollection,
    getRootDocuments,
    getDocumentChildren
  } = useDocuments();

  const [expandedCollections, setExpandedCollections] = useState(new Set());
  const [expandedDocuments, setExpandedDocuments] = useState(new Set());

  const toggleCollection = (collectionId) => {
    setExpandedCollections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId);
      } else {
        newSet.add(collectionId);
      }
      return newSet;
    });
  };

  const toggleDocument = (documentId) => {
    setExpandedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  const handleCreateCollection = () => {
    const collection = createCollection();
    setCurrentCollection(collection);
    setExpandedCollections(prev => new Set(prev).add(collection.id));
  };

  const handleCreateDocument = (parentId = null, collectionId = null) => {
    const doc = createDocument(parentId, collectionId);
    if (parentId) {
      setExpandedDocuments(prev => new Set(prev).add(parentId));
    }
    if (collectionId) {
      setExpandedCollections(prev => new Set(prev).add(collectionId));
    }
  };

  const VisibilityIcon = ({ visibility }) => {
    switch (visibility) {
      case 'public':
        return <FaGlobe className="text-xs text-gray-400" title="Public" />;
      case 'private':
      default:
        return <FaLock className="text-xs text-gray-400" title="Private" />;
    }
  };

  const DocumentItem = ({ document, level = 0 }) => {
    const children = getDocumentChildren(document.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedDocuments.has(document.id);
    const isActive = currentDocument?.id === document.id;

    return (
      <div className="my-0.5">
        <div
          className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-150 relative ${
            isActive
              ? 'bg-blue-50 text-blue-700 shadow-sm'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {hasChildren ? (
            <button
              className="flex items-center justify-center w-4 h-4 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
              onClick={() => toggleDocument(document.id)}
            >
              {isExpanded ? <FaChevronDown className="text-xs" /> : <FaChevronRight className="text-xs" />}
            </button>
          ) : (
            <span className="w-4 h-4 flex-shrink-0" />
          )}

          <FaFileAlt className="text-sm flex-shrink-0 text-gray-500" />

          <span
            className="flex-1 text-sm font-medium truncate"
            onClick={() => setCurrentDocument(document)}
          >
            {document.title}
          </span>

          <VisibilityIcon visibility={document.visibility} />

          <div className="hidden group-hover:flex items-center gap-1">
            <button
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-all"
              onClick={() => handleCreateDocument(document.id, document.collectionId)}
              title="Add sub-document"
            >
              <FaPlus className="text-xs" />
            </button>
            <button
              className="p-1.5 rounded hover:bg-red-100 text-gray-600 hover:text-red-600 transition-all"
              onClick={() => deleteDocument(document.id)}
              title="Delete"
            >
              <FaTrash className="text-xs" />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {children.map(child => (
              <DocumentItem key={child.id} document={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const CollectionItem = ({ collection }) => {
    const isExpanded = expandedCollections.has(collection.id);
    const documents = getRootDocuments(collection.id);
    const isActive = currentCollection?.id === collection.id;

    return (
      <div className="my-1">
        <div
          className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all duration-150 ${
            isActive
              ? 'bg-blue-50 text-blue-700 shadow-sm'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <button
            className="flex items-center justify-center w-4 h-4 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
            onClick={() => toggleCollection(collection.id)}
          >
            {isExpanded ? <FaChevronDown className="text-xs" /> : <FaChevronRight className="text-xs" />}
          </button>

          {isExpanded ? (
            <FaFolderOpen className="text-base flex-shrink-0 text-blue-500" />
          ) : (
            <FaFolder className="text-base flex-shrink-0 text-gray-500" />
          )}

          <span
            className="flex-1 text-sm font-semibold truncate flex items-center gap-1.5"
            onClick={() => {
              setCurrentCollection(collection);
              setCurrentDocument(null);
            }}
          >
            <span>{collection.icon}</span>
            <span>{collection.name}</span>
          </span>

          <VisibilityIcon visibility={collection.visibility} />

          <div className="hidden group-hover:flex items-center gap-1">
            <button
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-all"
              onClick={() => handleCreateDocument(null, collection.id)}
              title="Add document"
            >
              <FaPlus className="text-xs" />
            </button>
            <button
              className="p-1.5 rounded hover:bg-red-100 text-gray-600 hover:text-red-600 transition-all"
              onClick={() => deleteCollection(collection.id)}
              title="Delete collection"
            >
              <FaTrash className="text-xs" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="ml-2 mt-1">
            {documents.map(doc => (
              <DocumentItem key={doc.id} document={doc} level={0} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const uncategorizedDocs = getRootDocuments(null);

  return (
    <div className="w-72 h-full bg-gray-50 border-r border-gray-200 flex flex-col shadow-sm">
      <div className="px-4 py-4 bg-white border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FaFileAlt className="text-blue-600" />
          <span>Documentation</span>
        </h2>
        <div className="flex gap-2">
          <button
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
            onClick={handleCreateCollection}
            title="New Collection"
          >
            <FaFolder className="text-sm" />
          </button>
          <button
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
            onClick={() => handleCreateDocument()}
            title="New Document"
          >
            <FaPlus className="text-sm" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {collections.length === 0 && uncategorizedDocs.length === 0 && (
          <div className="px-4 py-12 text-center">
            <div className="mb-3">
              <FaFileAlt className="text-4xl text-gray-300 mx-auto" />
            </div>
            <p className="text-gray-500 font-medium mb-1">No documents yet</p>
            <p className="text-sm text-gray-400">Create a collection or document to get started</p>
          </div>
        )}

        {collections.map(collection => (
          <CollectionItem key={collection.id} collection={collection} />
        ))}

        {uncategorizedDocs.length > 0 && (
          <div className="mt-4">
            {collections.length > 0 && (
              <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Uncategorized
              </div>
            )}
            {uncategorizedDocs.map(doc => (
              <DocumentItem key={doc.id} document={doc} level={0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentSidebar;
