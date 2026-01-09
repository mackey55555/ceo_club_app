'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { supabase } from '@/lib/supabase';
import { useRef } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = '本文を入力してください...',
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false, // StarterKitのLinkを無効化
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4 text-gray-900',
      },
    },
  });

  const handleImageUpload = async (file: File) => {
    if (!editor) return;

    try {
      // 画像ファイルかチェック
      if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください');
        return;
      }

      // ファイルサイズチェック（5MB以下）
      if (file.size > 5 * 1024 * 1024) {
        alert('ファイルサイズは5MB以下にしてください');
        return;
      }

      // ファイル名を生成
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `body-images/${fileName}`;

      // Supabase Storageにアップロード
      const { data, error } = await supabase.storage
        .from('thumbnails')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // 公開URLを取得
      const {
        data: { publicUrl },
      } = supabase.storage.from('thumbnails').getPublicUrl(filePath);

      // エディタに画像を挿入
      editor.chain().focus().setImage({ src: publicUrl }).run();

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert('画像のアップロードに失敗しました: ' + error.message);
      return null;
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 rounded-md">
      {/* ツールバー */}
      <div className="border-b border-gray-300 p-2 flex flex-wrap gap-2 bg-gray-50">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded ${
            editor.isActive('bold')
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded ${
            editor.isActive('italic')
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`px-3 py-1 rounded ${
            editor.isActive('strike')
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <s>S</s>
        </button>
        <div className="border-l border-gray-300 mx-1" />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 1 }).run();
          }}
          className={`px-3 py-1 rounded ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          H1
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 2 }).run();
          }}
          className={`px-3 py-1 rounded ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 3 }).run();
          }}
          className={`px-3 py-1 rounded ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          H3
        </button>
        <div className="border-l border-gray-300 mx-1" />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBulletList().run();
          }}
          className={`px-3 py-1 rounded ${
            editor.isActive('bulletList')
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          • リスト
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleOrderedList().run();
          }}
          className={`px-3 py-1 rounded ${
            editor.isActive('orderedList')
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          1. リスト
        </button>
        <div className="border-l border-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('URLを入力してください:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`px-3 py-1 rounded ${
            editor.isActive('link')
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          リンク
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
          className="px-3 py-1 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          リンク解除
        </button>
        <div className="border-l border-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1 rounded bg-white text-gray-700 hover:bg-gray-100"
        >
          画像挿入
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleImageUpload(file);
            }
            // 同じファイルを再度選択できるようにリセット
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
          className="hidden"
        />
      </div>

      {/* エディタ */}
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

