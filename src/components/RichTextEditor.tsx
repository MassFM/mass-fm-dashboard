'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { useEffect, useCallback } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: ReturnType<typeof useEditor> }) => {
  if (!editor) return null;

  const addImage = useCallback(() => {
    const url = window.prompt('Masukkan URL gambar:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addLink = useCallback(() => {
    const url = window.prompt('Masukkan URL link:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const btnClass = (active: boolean) =>
    `p-1.5 rounded-lg text-xs transition-all ${
      active
        ? 'bg-purple-100 text-purple-700 font-bold'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
    }`;

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-slate-200 bg-slate-50/50 rounded-t-xl">
      {/* Text Style */}
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Bold">
        <span className="font-bold">B</span>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Italic">
        <span className="italic">I</span>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))} title="Underline">
        <span className="underline">U</span>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive('strike'))} title="Strikethrough">
        <span className="line-through">S</span>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()} className={btnClass(editor.isActive('highlight'))} title="Highlight">
        <span className="bg-yellow-200 px-0.5">H</span>
      </button>

      <div className="w-px h-6 bg-slate-200 mx-1 self-center" />

      {/* Headings */}
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))} title="Heading 2">
        H2
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive('heading', { level: 3 }))} title="Heading 3">
        H3
      </button>

      <div className="w-px h-6 bg-slate-200 mx-1 self-center" />

      {/* Alignment */}
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btnClass(editor.isActive({ textAlign: 'left' }))} title="Rata Kiri">
        ☰
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btnClass(editor.isActive({ textAlign: 'center' }))} title="Rata Tengah">
        ≡
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={btnClass(editor.isActive({ textAlign: 'right' }))} title="Rata Kanan">
        ☰
      </button>

      <div className="w-px h-6 bg-slate-200 mx-1 self-center" />

      {/* Lists */}
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Bullet List">
        •≡
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="Numbered List">
        1.
      </button>

      <div className="w-px h-6 bg-slate-200 mx-1 self-center" />

      {/* Block */}
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))} title="Blockquote">
        ❝
      </button>
      <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnClass(false)} title="Horizontal Rule">
        ―
      </button>

      <div className="w-px h-6 bg-slate-200 mx-1 self-center" />

      {/* Media */}
      <button type="button" onClick={addImage} className={btnClass(false)} title="Sisipkan Gambar">
        🖼️
      </button>
      <button type="button" onClick={addLink} className={btnClass(editor.isActive('link'))} title="Sisipkan Link">
        🔗
      </button>
      {editor.isActive('link') && (
        <button type="button" onClick={() => editor.chain().focus().unsetLink().run()} className="p-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50" title="Hapus Link">
          ✕
        </button>
      )}

      <div className="w-px h-6 bg-slate-200 mx-1 self-center" />

      {/* Undo/Redo */}
      <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={`p-1.5 rounded-lg text-xs ${editor.can().undo() ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-300'}`} title="Undo">
        ↶
      </button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={`p-1.5 rounded-lg text-xs ${editor.can().redo() ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-300'}`} title="Redo">
        ↷
      </button>
    </div>
  );
};

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-purple-600 underline' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Highlight.configure({ multicolor: false }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none text-slate-700 [&_img]:rounded-xl [&_img]:max-w-full [&_img]:mx-auto [&_blockquote]:border-l-4 [&_blockquote]:border-purple-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-500',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  // Sync content from outside (e.g. when editing a schedule)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
      {!content && (
        <style>{`
          .ProseMirror p.is-editor-empty:first-child::before {
            content: '${placeholder || "Tulis resume/transkrip kajian di sini..."}';
            color: #94a3b8;
            float: left;
            pointer-events: none;
            height: 0;
          }
        `}</style>
      )}
    </div>
  );
}
