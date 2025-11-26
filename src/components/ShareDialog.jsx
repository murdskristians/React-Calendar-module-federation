import React, { useState } from 'react';
import { useDocuments } from '../context/DocumentContext';
import { VISIBILITY_TYPES } from '../types';
import { FaTimes, FaGlobe, FaLock, FaUserFriends, FaPlus, FaTrash, FaCopy } from 'react-icons/fa';

const ShareDialog = ({ item, onClose, isCollection }) => {
  const { updateDocument, updateCollection, shareDocument } = useDocuments();
  const [visibility, setVisibility] = useState(item.visibility);
  const [sharedUsers, setSharedUsers] = useState(item.sharedWith || []);
  const [newUserEmail, setNewUserEmail] = useState('');

  const handleSave = () => {
    const updates = {
      visibility,
      sharedWith: visibility === VISIBILITY_TYPES.SHARED ? sharedUsers : []
    };

    if (isCollection) {
      updateCollection(item.id, updates);
    } else {
      updateDocument(item.id, updates);
    }

    onClose();
  };

  const handleAddUser = () => {
    if (newUserEmail && !sharedUsers.includes(newUserEmail)) {
      setSharedUsers([...sharedUsers, newUserEmail]);
      setNewUserEmail('');
    }
  };

  const handleRemoveUser = (email) => {
    setSharedUsers(sharedUsers.filter(u => u !== email));
  };

  const visibilityOptions = [
    {
      value: VISIBILITY_TYPES.PRIVATE,
      icon: <FaLock />,
      title: 'Private',
      description: 'Only you can access this'
    },
    {
      value: VISIBILITY_TYPES.SHARED,
      icon: <FaUserFriends />,
      title: 'Shared',
      description: 'Share with specific people'
    },
    {
      value: VISIBILITY_TYPES.PUBLIC,
      icon: <FaGlobe />,
      title: 'Public',
      description: 'Anyone with the link can view'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
          <h2 className="text-2xl font-bold text-gray-800">
            Share {isCollection ? 'Collection' : 'Document'}
          </h2>
          <button
            className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-all"
            onClick={onClose}
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-lg font-semibold text-blue-900">
              {isCollection ? `${item.icon} ${item.name}` : item.title}
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Visibility</h3>
            <div className="space-y-3">
              {visibilityOptions.map(option => (
                <label
                  key={option.value}
                  className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    visibility === option.value
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={option.value}
                    checked={visibility === option.value}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{option.icon}</span>
                      <span className="font-semibold text-gray-800">{option.title}</span>
                    </div>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {visibility === VISIBILITY_TYPES.SHARED && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Shared with</h3>

              <div className="flex gap-2 mb-4">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddUser();
                    }
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md font-medium"
                  onClick={handleAddUser}
                >
                  <FaPlus />
                  <span>Add</span>
                </button>
              </div>

              {sharedUsers.length > 0 && (
                <div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {sharedUsers.map((email, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-700 font-medium">{email}</span>
                      <button
                        className="p-2 rounded-lg hover:bg-red-100 text-gray-600 hover:text-red-600 transition-all"
                        onClick={() => handleRemoveUser(email)}
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {sharedUsers.length === 0 && (
                <p className="text-gray-500 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
                  No users added yet. Add email addresses to share with specific people.
                </p>
              )}
            </div>
          )}

          {visibility === VISIBILITY_TYPES.PUBLIC && (
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                This {isCollection ? 'collection' : 'document'} will be accessible to anyone with the link.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/${isCollection ? 'collection' : 'doc'}/${item.id}`}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 focus:outline-none"
                />
                <button
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all shadow-sm hover:shadow-md font-medium"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/${isCollection ? 'collection' : 'doc'}/${item.id}`);
                  }}
                >
                  <FaCopy />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md font-medium"
            onClick={handleSave}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;
