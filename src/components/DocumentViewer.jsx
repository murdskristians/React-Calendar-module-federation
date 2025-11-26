import React, { useState, useEffect } from 'react';
import { useDocuments } from '../context/DocumentContext';
import RichTextEditor from './RichTextEditor';
import ShareDialog from './ShareDialog';
import { FaEdit, FaSave, FaTimes, FaShare, FaGlobe, FaLock, FaFileAlt } from 'react-icons/fa';

const DocumentViewer = () => {
  const {
    currentDocument,
    currentCollection,
    updateDocument,
    updateCollection
  } = useDocuments();

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState(false);
  const [editedCollectionName, setEditedCollectionName] = useState('');

  useEffect(() => {
    if (currentDocument) {
      setEditedTitle(currentDocument.title);
      setEditedContent(currentDocument.content);
      setIsEditing(false);
    }
  }, [currentDocument]);

  useEffect(() => {
    if (currentCollection) {
      setEditedCollectionName(currentCollection.name);
      setEditingCollection(false);
    }
  }, [currentCollection]);

  const handleSaveDocument = async () => {
    if (currentDocument) {
      await updateDocument(currentDocument.id, {
        title: editedTitle,
        content: editedContent
      });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    if (currentDocument) {
      setEditedTitle(currentDocument.title);
      setEditedContent(currentDocument.content);
      setIsEditing(false);
    }
  };

  const handleSaveCollection = async () => {
    if (currentCollection) {
      await updateCollection(currentCollection.id, {
        name: editedCollectionName
      });
      setEditingCollection(false);
    }
  };

  const VisibilityBadge = ({ visibility }) => {
    const icons = {
      public: { icon: <FaGlobe />, label: 'Public', className: 'bg-green-100 text-green-700 border-green-200' },
      private: { icon: <FaLock />, label: 'Private', className: 'bg-gray-100 text-gray-700 border-gray-200' }
    };

    const config = icons[visibility] || icons.private;

    return (
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${config.className}`}>
        {config.icon}
        <span>{config.label}</span>
      </div>
    );
  };

  if (!currentDocument && !currentCollection) {
    return (
      <div className="flex-1 flex flex-col h-full bg-white items-center justify-center">
        <div className="text-center px-8 py-12">
          <div className="mb-4">
            <FaFileAlt className="text-6xl text-gray-300 mx-auto" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">No document selected</h2>
          <p className="text-gray-500">Select a document from the sidebar or create a new one to get started</p>
        </div>
      </div>
    );
  }

  if (currentCollection && !currentDocument) {
    return (
      <div className="flex-1 flex flex-col h-full bg-white">
        <div className="px-8 py-6 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm">
          <div className="flex-1 flex items-center gap-4">
            {editingCollection ? (
              <input
                type="text"
                className="text-3xl font-bold border-2 border-blue-500 rounded-lg px-3 py-2 outline-none flex-1 max-w-xl"
                value={editedCollectionName}
                onChange={(e) => setEditedCollectionName(e.target.value)}
                onBlur={handleSaveCollection}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveCollection();
                  if (e.key === 'Escape') setEditingCollection(false);
                }}
                autoFocus
              />
            ) : (
              <h1
                className="text-3xl font-bold text-gray-800 cursor-pointer hover:text-gray-600 transition-colors flex items-center gap-2"
                onClick={() => setEditingCollection(true)}
              >
                <span className="text-4xl">{currentCollection.icon}</span>
                <span>{currentCollection.name}</span>
              </h1>
            )}
            <VisibilityBadge visibility={currentCollection.visibility} />
          </div>
          <div className="flex gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md font-medium"
              onClick={() => setShowShareDialog(true)}
            >
              <FaShare />
              <span>Share</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="px-8 py-6">
            <p className="text-gray-600 mb-4">{currentCollection.description || 'No description'}</p>
            <p className="text-sm text-gray-400">
              Created: {new Date(currentCollection.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        {showShareDialog && (
          <ShareDialog
            item={currentCollection}
            onClose={() => setShowShareDialog(false)}
            isCollection={true}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      <div className="px-8 py-6 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm">
        <div className="flex-1 flex items-center gap-4">
          {isEditing ? (
            <input
              type="text"
              className="text-3xl font-bold border-2 border-blue-500 rounded-lg px-3 py-2 outline-none flex-1 max-w-xl"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder="Document title"
            />
          ) : (
            <h1 className="text-3xl font-bold text-gray-800">{currentDocument.title}</h1>
          )}
          <VisibilityBadge visibility={currentDocument.visibility} />
        </div>
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm hover:shadow-md font-medium"
                onClick={handleSaveDocument}
              >
                <FaSave />
                <span>Save</span>
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all shadow-sm hover:shadow-md font-medium"
                onClick={handleCancelEdit}
              >
                <FaTimes />
                <span>Cancel</span>
              </button>
            </>
          ) : (
            <>
              <button
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md font-medium"
                onClick={() => setIsEditing(true)}
              >
                <FaEdit />
                <span>Edit</span>
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md font-medium"
                onClick={() => setShowShareDialog(true)}
              >
                <FaShare />
                <span>Share</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {isEditing ? (
          <RichTextEditor
            key={`edit-${currentDocument.id}`}
            value={editedContent}
            onChange={setEditedContent}
            readOnly={false}
          />
        ) : (
          <RichTextEditor
            key={`view-${currentDocument.id}`}
            value={currentDocument.content}
            onChange={() => {}}
            readOnly={true}
          />
        )}
      </div>

      <div className="px-8 py-3 border-t border-gray-200 bg-gray-50">
        <span className="text-sm text-gray-500">
          Last updated: {new Date(currentDocument.updatedAt).toLocaleString()}
        </span>
      </div>

      {showShareDialog && (
        <ShareDialog
          item={currentDocument}
          onClose={() => setShowShareDialog(false)}
          isCollection={false}
        />
      )}
    </div>
  );
};

export default DocumentViewer;
