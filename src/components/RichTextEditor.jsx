import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { createEditor, Editor, Transforms, Element as SlateElement, Range, Point } from 'slate';
import { Slate, Editable, withReact, useSlate, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import { FaBold, FaItalic, FaUnderline, FaCode, FaListUl, FaListOl, FaQuoteLeft, FaStrikethrough, FaLink, FaComment, FaImage, FaCheckSquare } from 'react-icons/fa';
import './RichTextEditor.css';

const RichTextEditor = ({ value, onChange, readOnly = false }) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [slashCommand, setSlashCommand] = useState(null);
  const [search, setSearch] = useState('');
  const slashMenuRef = useRef(null);

  const renderElement = useCallback(props => {
    switch (props.element.type) {
      case 'heading-one':
        return <h1 {...props.attributes}>{props.children}</h1>;
      case 'heading-two':
        return <h2 {...props.attributes}>{props.children}</h2>;
      case 'heading-three':
        return <h3 {...props.attributes}>{props.children}</h3>;
      case 'heading-four':
        return <h4 {...props.attributes}>{props.children}</h4>;
      case 'bulleted-list':
        return <ul {...props.attributes}>{props.children}</ul>;
      case 'numbered-list':
        return <ol {...props.attributes}>{props.children}</ol>;
      case 'task-list':
        return <ul className="task-list" {...props.attributes}>{props.children}</ul>;
      case 'list-item':
        return <li {...props.attributes}>{props.children}</li>;
      case 'task-item':
        return (
          <li className="task-item" {...props.attributes}>
            <span contentEditable={false} className="task-checkbox">
              <input type="checkbox" />
            </span>
            <span>{props.children}</span>
          </li>
        );
      case 'block-quote':
        return <blockquote {...props.attributes}>{props.children}</blockquote>;
      case 'code-block':
        return <pre {...props.attributes}><code>{props.children}</code></pre>;
      default:
        return <p {...props.attributes}>{props.children}</p>;
    }
  }, []);

  const renderLeaf = useCallback(props => {
    let { attributes, children, leaf } = props;

    if (leaf.bold) {
      children = <strong>{children}</strong>;
    }
    if (leaf.italic) {
      children = <em>{children}</em>;
    }
    if (leaf.underline) {
      children = <u>{children}</u>;
    }
    if (leaf.strikethrough) {
      children = <s>{children}</s>;
    }
    if (leaf.code) {
      children = <code>{children}</code>;
    }

    return <span {...attributes}>{children}</span>;
  }, []);

  const handleKeyDown = useCallback((event) => {
    const { selection } = editor;

    // Handle Backspace to exit lists when empty
    if (event.key === 'Backspace' && selection) {
      // Get the current block
      const [listItemMatch] = Editor.nodes(editor, {
        match: n => !Editor.isEditor(n) && SlateElement.isElement(n) &&
                   ['list-item', 'task-item'].includes(n.type),
      });

      if (listItemMatch) {
        const [listItemNode, listItemPath] = listItemMatch;

        // Get the text content of the list item
        const text = Editor.string(editor, listItemPath);
        const { anchor } = selection;

        // Check if cursor is at the start and the item is empty
        if (anchor.offset === 0 && text.length === 0) {
          event.preventDefault();

          // Delete the current list item first
          Transforms.removeNodes(editor, { at: listItemPath });

          // Insert a paragraph
          Transforms.insertNodes(editor, {
            type: 'paragraph',
            children: [{ text: '' }],
          });

          return;
        }
      }
    }

    // Handle Enter key to reset block types or exit lists when empty
    if (event.key === 'Enter' && !event.shiftKey && selection) {
      // Check for list items
      const [listItemMatch] = Editor.nodes(editor, {
        match: n => !Editor.isEditor(n) && SlateElement.isElement(n) &&
                   ['list-item', 'task-item'].includes(n.type),
      });

      if (listItemMatch) {
        const [listItemNode, listItemPath] = listItemMatch;
        const text = Editor.string(editor, listItemPath);

        // If the list item is empty, exit the list
        if (text.length === 0) {
          event.preventDefault();

          // Remove the empty list item
          Transforms.removeNodes(editor, { at: listItemPath });

          // Insert a paragraph after the list
          Transforms.insertNodes(editor, {
            type: 'paragraph',
            children: [{ text: '' }],
          });

          return;
        }
        // Otherwise, let default behavior create a new list item
        return;
      }

      // Check for headings and quotes
      const [blockMatch] = Editor.nodes(editor, {
        match: n => !Editor.isEditor(n) && SlateElement.isElement(n) &&
                   ['heading-one', 'heading-two', 'heading-three', 'heading-four', 'block-quote'].includes(n.type),
      });

      if (blockMatch) {
        event.preventDefault();
        Transforms.insertNodes(editor, {
          type: 'paragraph',
          children: [{ text: '' }],
        });
        return;
      }
    }

    // Slash command handling
    if (event.key === '/' && !slashCommand) {
      const { selection } = editor;
      if (selection && Range.isCollapsed(selection)) {
        const [start] = Range.edges(selection);
        const before = Editor.before(editor, start, { unit: 'line' });
        const beforeRange = before && Editor.range(editor, before, start);
        const beforeText = beforeRange && Editor.string(editor, beforeRange);

        if (!beforeText || beforeText.trim() === '') {
          event.preventDefault();
          setSlashCommand(start);
          setSearch('');
          return;
        }
      }
    }

    // Close slash menu on Escape
    if (event.key === 'Escape' && slashCommand) {
      event.preventDefault();
      setSlashCommand(null);
      setSearch('');
      return;
    }

    // Navigate slash menu with arrow keys
    if (slashCommand && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      // Menu navigation handled in SlashCommandMenu component
      return;
    }

    // Keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'b': {
          event.preventDefault();
          toggleMark(editor, 'bold');
          break;
        }
        case 'i': {
          event.preventDefault();
          toggleMark(editor, 'italic');
          break;
        }
        case 'u': {
          event.preventDefault();
          toggleMark(editor, 'underline');
          break;
        }
        case '`': {
          event.preventDefault();
          toggleMark(editor, 'code');
          break;
        }
        case 'd': {
          event.preventDefault();
          toggleMark(editor, 'strikethrough');
          break;
        }
      }

      // Block type shortcuts with Ctrl/Cmd + Shift
      if (event.shiftKey) {
        switch (event.key) {
          case '1': {
            event.preventDefault();
            toggleBlock(editor, 'heading-one');
            break;
          }
          case '2': {
            event.preventDefault();
            toggleBlock(editor, 'heading-two');
            break;
          }
          case '3': {
            event.preventDefault();
            toggleBlock(editor, 'heading-three');
            break;
          }
          case '4': {
            event.preventDefault();
            toggleBlock(editor, 'heading-four');
            break;
          }
          case '7': {
            event.preventDefault();
            toggleBlock(editor, 'task-list');
            break;
          }
          case '8': {
            event.preventDefault();
            toggleBlock(editor, 'bulleted-list');
            break;
          }
          case '9': {
            event.preventDefault();
            toggleBlock(editor, 'numbered-list');
            break;
          }
        }
      }
    }
  }, [editor, slashCommand]);

  // Handle slash command search
  const handleChange = useCallback((newValue) => {
    onChange(newValue);

    if (slashCommand) {
      const { selection } = editor;
      if (selection && Range.isCollapsed(selection)) {
        const [start] = Range.edges(selection);
        const range = Editor.range(editor, slashCommand, start);
        const text = Editor.string(editor, range);

        if (text.startsWith('/')) {
          setSearch(text.slice(1));
        } else {
          setSlashCommand(null);
          setSearch('');
        }
      }
    }
  }, [onChange, slashCommand, editor]);

  return (
    <div className="flex flex-col h-full bg-white relative">
      <Slate editor={editor} initialValue={value} onChange={handleChange}>
        {!readOnly && <FloatingToolbar />}
        <Editable
          className="flex-1 px-20 py-12 overflow-y-auto prose prose-lg max-w-none focus:outline-none"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#374151'
          }}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={handleKeyDown}
          placeholder="Type '/' for commands..."
          readOnly={readOnly}
        />
        {!readOnly && slashCommand && (
          <SlashCommandMenu
            editor={editor}
            search={search}
            target={slashCommand}
            onClose={() => {
              setSlashCommand(null);
              setSearch('');
            }}
          />
        )}
      </Slate>
    </div>
  );
};

// Floating Toolbar Component
const FloatingToolbar = () => {
  const editor = useSlate();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef(null);

  useEffect(() => {
    const { selection } = editor;

    if (!selection || Range.isCollapsed(selection)) {
      setIsVisible(false);
      return;
    }

    const domSelection = window.getSelection();
    if (!domSelection || domSelection.rangeCount === 0) {
      setIsVisible(false);
      return;
    }

    const domRange = domSelection.getRangeAt(0);
    const rect = domRange.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      setIsVisible(true);

      // Use setTimeout to ensure toolbar is rendered before calculating position
      setTimeout(() => {
        if (toolbarRef.current) {
          const toolbar = toolbarRef.current;
          const toolbarWidth = toolbar.offsetWidth;
          const toolbarHeight = toolbar.offsetHeight;

          const top = rect.top - toolbarHeight - 10;
          const left = rect.left + rect.width / 2 - toolbarWidth / 2;

          setPosition({ top, left });
        }
      }, 0);
    } else {
      setIsVisible(false);
    }
  }, [editor.selection]);

  if (!isVisible) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 bg-gray-900 text-white rounded-lg shadow-2xl p-1 flex items-center gap-0.5"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <ToolbarButton format="bold" icon={<FaBold />} />
      <ToolbarButton format="italic" icon={<FaItalic />} />
      <ToolbarButton format="underline" icon={<FaUnderline />} />
      <ToolbarButton format="strikethrough" icon={<FaStrikethrough />} />
      <ToolbarButton format="code" icon={<FaCode />} />
      <div className="w-px h-6 bg-gray-600 mx-1" />
      <BlockToolbarButton format="heading-one" icon="H1" />
      <BlockToolbarButton format="heading-two" icon="H2" />
      <BlockToolbarButton format="heading-three" icon="H3" />
      <div className="w-px h-6 bg-gray-600 mx-1" />
      <BlockToolbarButton format="bulleted-list" icon={<FaListUl />} />
      <BlockToolbarButton format="numbered-list" icon={<FaListOl />} />
      <BlockToolbarButton format="block-quote" icon={<FaQuoteLeft />} />
      <div className="w-px h-6 bg-gray-600 mx-1" />
      <button
        className="p-2 hover:bg-gray-700 rounded transition-colors"
        title="Link"
      >
        <FaLink className="text-sm" />
      </button>
      <button
        className="p-2 hover:bg-gray-700 rounded transition-colors"
        title="Comment"
      >
        <FaComment className="text-sm" />
      </button>
    </div>
  );
};

// Toolbar Button Component
const ToolbarButton = ({ format, icon }) => {
  const editor = useSlate();
  const isActive = isMarkActive(editor, format);

  return (
    <button
      className={`p-2 rounded transition-colors ${
        isActive ? 'bg-blue-600' : 'hover:bg-gray-700'
      }`}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleMark(editor, format);
      }}
    >
      <span className="text-sm">{icon}</span>
    </button>
  );
};

// Block Toolbar Button Component
const BlockToolbarButton = ({ format, icon }) => {
  const editor = useSlate();
  const isActive = isBlockActive(editor, format);

  return (
    <button
      className={`p-2 rounded transition-colors font-semibold text-sm ${
        isActive ? 'bg-blue-600' : 'hover:bg-gray-700'
      }`}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleBlock(editor, format);
      }}
    >
      {icon}
    </button>
  );
};

// Slash Command Menu Component
const SlashCommandMenu = ({ editor, search, target, onClose }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);

  const commands = [
    {
      title: 'Big heading',
      subtitle: 'H1',
      shortcut: '^⌘1',
      icon: 'H1',
      action: () => insertBlock(editor, 'heading-one', target),
    },
    {
      title: 'Medium heading',
      subtitle: 'H2',
      shortcut: '^⌘2',
      icon: 'H2',
      action: () => insertBlock(editor, 'heading-two', target),
    },
    {
      title: 'Small heading',
      subtitle: 'H3',
      shortcut: '^⌘3',
      icon: 'H3',
      action: () => insertBlock(editor, 'heading-three', target),
    },
    {
      title: 'Extra small heading',
      subtitle: 'H4',
      shortcut: '^⌘4',
      icon: 'H4',
      action: () => insertBlock(editor, 'heading-four', target),
    },
    {
      title: 'Task list',
      subtitle: '',
      shortcut: '^⌘7',
      icon: <FaCheckSquare />,
      action: () => insertBlock(editor, 'task-list', target),
    },
    {
      title: 'Bulleted list',
      subtitle: '',
      shortcut: '^⌘8',
      icon: <FaListUl />,
      action: () => insertBlock(editor, 'bulleted-list', target),
    },
    {
      title: 'Ordered list',
      subtitle: '',
      shortcut: '^⌘9',
      icon: <FaListOl />,
      action: () => insertBlock(editor, 'numbered-list', target),
    },
    {
      title: 'Quote',
      subtitle: '',
      shortcut: '',
      icon: <FaQuoteLeft />,
      action: () => insertBlock(editor, 'block-quote', target),
    },
    {
      title: 'Image',
      subtitle: '',
      shortcut: '',
      icon: <FaImage />,
      action: () => {
        onClose();
        // Image upload would go here
      },
    },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (menuRef.current && target) {
      try {
        const domRange = ReactEditor.toDOMRange(editor, {
          anchor: target,
          focus: target,
        });
        const rect = domRange.getBoundingClientRect();
        // Position the menu relative to the viewport to avoid offset issues
        menuRef.current.style.top = `${rect.bottom + 5}px`;
        menuRef.current.style.left = `${rect.left}px`;
      } catch (e) {
        // Handle error silently
      }
    }
  }, [editor, target]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        filteredCommands[selectedIndex]?.action();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filteredCommands, onClose]);

  if (filteredCommands.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-gray-900 text-white rounded-lg shadow-2xl overflow-hidden min-w-[300px]"
      style={{ maxHeight: '400px', overflowY: 'auto' }}
    >
      <div className="p-2">
        {filteredCommands.map((cmd, index) => (
          <button
            key={index}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              index === selectedIndex ? 'bg-blue-600' : 'hover:bg-gray-800'
            }`}
            onMouseEnter={() => setSelectedIndex(index)}
            onMouseDown={(e) => {
              e.preventDefault();
              cmd.action();
              onClose();
            }}
          >
            <div className="text-xl w-6 flex items-center justify-center font-semibold">
              {cmd.icon}
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium">{cmd.title}</span>
                {cmd.subtitle && (
                  <span className="text-xs text-gray-400">{cmd.subtitle}</span>
                )}
              </div>
            </div>
            {cmd.shortcut && (
              <span className="text-xs text-gray-400">{cmd.shortcut}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// Helper function to insert block
const insertBlock = (editor, format, target) => {
  // Get the current line
  const [start] = Range.edges(editor.selection);
  const lineStart = Editor.before(editor, start, { unit: 'line' }) || start;
  const lineEnd = Editor.after(editor, start, { unit: 'line' }) || start;
  const lineRange = Editor.range(editor, lineStart, lineEnd);

  // Get the text on the line and check if it starts with /
  const lineText = Editor.string(editor, lineRange);

  // Find where the slash command starts
  const slashIndex = lineText.indexOf('/');
  if (slashIndex !== -1) {
    // Delete from the slash to the current cursor position
    const deleteStart = Editor.point(editor, lineStart, { edge: 'start' });
    const deleteOffset = slashIndex;
    const deletePoint = {
      path: deleteStart.path,
      offset: deleteStart.offset + deleteOffset
    };

    Transforms.delete(editor, {
      at: {
        anchor: deletePoint,
        focus: start
      }
    });
  }

  const isList = ['numbered-list', 'bulleted-list', 'task-list'].includes(format);

  // For lists, we need to handle them differently
  if (isList) {
    const listItemType = format === 'task-list' ? 'task-item' : 'list-item';

    // Convert current block to list item
    Transforms.setNodes(editor, { type: listItemType });

    // Wrap in list
    const listBlock = { type: format, children: [] };
    Transforms.wrapNodes(editor, listBlock, {
      match: (n) => n.type === listItemType,
    });
  } else {
    // For headings and other blocks, just set the node type
    Transforms.setNodes(editor, { type: format });
  }
};

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(editor, format);
  const isList = ['numbered-list', 'bulleted-list', 'task-list'].includes(format);

  Transforms.unwrapNodes(editor, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && ['numbered-list', 'bulleted-list', 'task-list'].includes(n.type),
    split: true,
  });

  const newProperties = {
    type: isActive ? 'paragraph' : isList ? (format === 'task-list' ? 'task-item' : 'list-item') : format,
  };
  Transforms.setNodes(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

const isBlockActive = (editor, format) => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
    })
  );

  return !!match;
};

export default RichTextEditor;
