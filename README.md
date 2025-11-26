# Documentation Module

A full-featured documentation management system built with React and Module Federation. Similar to Outline, it provides a powerful platform for creating, organizing, and sharing documentation with hierarchical structure and flexible permissions.

## Features

### Document Management
- **Create & Edit Documents**: Rich text editor powered by Slate.js with formatting support
- **Hierarchical Structure**: Organize documents with parent-child relationships (sub-documents)
- **Collections**: Group related documents into collections with icons and descriptions
- **Real-time Editing**: Edit documents inline with auto-save capabilities

### Rich Text Editor
- **Text Formatting**: Bold, italic, underline, code
- **Headings**: H1, H2, H3 support
- **Lists**: Bulleted and numbered lists
- **Block Elements**: Block quotes, code blocks
- **Keyboard Shortcuts**: Ctrl/Cmd + B/I/U for quick formatting

### Sharing & Permissions
- **Private Documents**: Only accessible to the creator
- **Public Documents**: Accessible to anyone with the link
- **Shared Documents**: Share with specific users via email
- **Collection-level Permissions**: Apply permissions to entire collections

### Organization
- **Sidebar Navigation**: Tree view with expandable/collapsible sections
- **Collections**: Group documents by topic or project
- **Drag & Drop** (Coming soon): Reorder documents and collections
- **Search** (Coming soon): Full-text search across all documents

## Architecture

### Technology Stack
- **React 18**: UI framework
- **Slate.js**: Rich text editing framework
- **Module Federation**: Micro-frontend architecture
- **React Context**: State management
- **React Icons**: Icon library

### Project Structure
```
src/
├── components/
│   ├── DocumentSidebar.jsx      # Navigation sidebar
│   ├── DocumentViewer.jsx       # Document display & editing
│   ├── RichTextEditor.jsx       # Rich text editor component
│   └── ShareDialog.jsx          # Sharing & permissions dialog
├── context/
│   └── DocumentContext.jsx      # Document state management
├── types.js                     # Type definitions
├── App.jsx                      # Main application
└── index.js                     # Entry point
```

### Data Structure

#### Document
```javascript
{
  id: string,
  title: string,
  content: array,              // Slate.js nodes
  parentId: string | null,     // Parent document ID for sub-documents
  collectionId: string | null, // Collection ID
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string,
  visibility: 'private' | 'public' | 'shared',
  sharedWith: array,          // Array of user IDs/emails
  order: number               // Display order
}
```

#### Collection
```javascript
{
  id: string,
  name: string,
  description: string,
  icon: string,               // Emoji icon
  createdAt: timestamp,
  visibility: 'private' | 'public' | 'shared',
  sharedWith: array          // Array of user IDs/emails
}
```

## Installation

```bash
npm install
```

## Development

Start the development server:
```bash
npm start
```

Start with test environment:
```bash
npm run start:test
```

The module will be available at `http://localhost:3001`

## Build

Build for production:
```bash
npm run build
```

Build for test environment:
```bash
npm run build:test
```

Build for production environment:
```bash
npm run build:prod
```

## Deployment

Deploy to Firebase hosting:
```bash
./deploy.sh test   # Deploy to test environment
./deploy.sh prod   # Deploy to production environment
```

See [DEPLOYMENT.md](DEPLOYMENT.md) and [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed deployment instructions.

## Usage

### Creating Documents

1. Click the **+** button in the sidebar header
2. A new untitled document will be created
3. Click on the document to open it
4. Edit the title by clicking on it
5. Use the rich text editor to add content

### Creating Collections

1. Click the **folder** icon in the sidebar header
2. A new collection will be created
3. Click on the collection name to edit it
4. Add documents to the collection using the **+** button next to the collection

### Creating Sub-Documents

1. Hover over a document in the sidebar
2. Click the **+** button that appears
3. A sub-document will be created as a child of that document

### Sharing Documents

1. Open a document or select a collection
2. Click the **Share** button in the header
3. Choose visibility:
   - **Private**: Only you can access
   - **Shared**: Add specific user emails
   - **Public**: Anyone with the link can view
4. Click **Save Changes**

### Editing Documents

1. Click on a document to view it
2. Click the **Edit** button in the header
3. Make your changes using the rich text editor
4. Click **Save** to save changes or **Cancel** to discard

## Module Federation

This module is designed to work with Module Federation and can be loaded as a remote module:

```javascript
// In your host application
const DocumentationModule = React.lazy(() => import('documentationModule/App'));

// Use the module
<DocumentationModule />
```

The module exposes:
- `./App` - Main documentation application component

## Future Enhancements

- [ ] Drag and drop for reordering
- [ ] Full-text search
- [ ] Document templates
- [ ] Version history
- [ ] Comments and discussions
- [ ] Export to PDF/Markdown
- [ ] Real-time collaboration
- [ ] Document linking and references
- [ ] File attachments
- [ ] Activity feed
- [ ] User mentions
- [ ] Mobile responsive improvements

## License

Proprietary - ERP System Module

## Support

For issues and feature requests, please contact the development team.
