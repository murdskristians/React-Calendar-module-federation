// Documentation Module Types

// Document structure
// {
//   id: string,
//   title: string,
//   content: array (Slate nodes),
//   parentId: string | null,
//   collectionId: string | null,
//   createdAt: timestamp,
//   updatedAt: timestamp,
//   createdBy: string,
//   visibility: 'private' | 'public',
//   order: number
// }

// Collection structure
// {
//   id: string,
//   name: string,
//   description: string,
//   icon: string,
//   createdAt: timestamp,
//   createdBy: string,
//   visibility: 'private' | 'public'
// }

export const VISIBILITY_TYPES = {
  PRIVATE: 'private',
  PUBLIC: 'public'
};

export const DEFAULT_DOCUMENT = {
  id: null,
  title: 'Untitled',
  content: [
    {
      type: 'paragraph',
      children: [{ text: '' }]
    }
  ],
  parentId: null,
  collectionId: null,
  createdAt: null,
  updatedAt: null,
  createdBy: null,
  visibility: VISIBILITY_TYPES.PRIVATE,
  order: 0
};

export const DEFAULT_COLLECTION = {
  id: null,
  name: 'New Collection',
  description: '',
  icon: '📁',
  createdAt: null,
  createdBy: null,
  visibility: VISIBILITY_TYPES.PRIVATE
};
