import React, { useState } from 'react';
import { useDocuments } from '../context/DocumentContext';
import { VISIBILITY_TYPES } from '../types';
import { FaTimes, FaGlobe, FaLock } from 'react-icons/fa';

const ShareDialog = ({ item, onClose, isCollection }) => {
  const { updateDocument, updateCollection } = useDocuments();
  const [visibility, setVisibility] = useState(item.visibility);

  const handleSave = () => {
    const updates = { visibility };

    if (isCollection) {
      updateCollection(item.id, updates);
    } else {
      updateDocument(item.id, updates);
    }

    onClose();
  };

  const visibilityOptions = [
    {
      value: VISIBILITY_TYPES.PRIVATE,
      icon: <FaLock />,
      title: 'Private',
      description: 'Only you can access this'
    },
    {
      value: VISIBILITY_TYPES.PUBLIC,
      icon: <FaGlobe />,
      title: 'Public',
      description: 'All users in the system can view this'
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
