'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface ImageUploadProps {
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
  bucketName?: string;
  folder?: string;
}

export default function ImageUpload({
  currentUrl,
  onUploadComplete,
  bucketName = 'thumbnails',
  folder = 'news',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    try {
      setUploading(true);

      // ファイル名を生成（タイムスタンプ + 元のファイル名）
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Supabase Storageにアップロード
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // 公開URLを取得
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(filePath);

      setPreviewUrl(publicUrl);
      onUploadComplete(publicUrl);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert('画像のアップロードに失敗しました: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onUploadComplete('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {previewUrl && (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt="プレビュー"
            className="max-w-full h-auto rounded border border-gray-300"
            style={{ maxHeight: '200px' }}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
          >
            ×
          </button>
        </div>
      )}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className={`inline-block px-4 py-2 rounded cursor-pointer ${
            uploading
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {uploading ? 'アップロード中...' : previewUrl ? '画像を変更' : '画像をアップロード'}
        </label>
      </div>
      {!previewUrl && (
        <p className="text-sm text-gray-500">
          または、URLを直接入力: <input
            type="url"
            placeholder="https://example.com/image.jpg"
            onChange={(e) => {
              const url = e.target.value;
              if (url) {
                setPreviewUrl(url);
                onUploadComplete(url);
              }
            }}
            className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </p>
      )}
    </div>
  );
}

