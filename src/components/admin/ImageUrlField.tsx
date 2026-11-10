'use client';

import { useState } from 'react';
import { ImageOff, X } from 'lucide-react';
import { cn, isValidHttpUrl } from '@/lib/utils';

interface ImageUrlFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  /** 提供時顯示「移除」按鈕（用於多圖列表） */
  onRemove?: () => void;
  className?: string;
}

/**
 * 圖片網址輸入 + 即時預覽。
 * Firebase Storage 需 Blaze 方案，所以現階段以貼網址方式收集圖片；
 * 日後接上上傳功能時，只需在此組件加入上傳按鈕，外層表單不用改。
 */
export function ImageUrlField({
  id,
  label,
  value,
  onChange,
  placeholder = 'https://example.com/photo.jpg',
  hint,
  error,
  onRemove,
  className,
}: ImageUrlFieldProps) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const trimmed = value.trim();
  const canPreview = trimmed !== '' && isValidHttpUrl(trimmed) && !previewFailed;

  function handleChange(next: string) {
    setPreviewFailed(false);
    onChange(next);
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor={id} className="label">
            {label}
          </label>
          <input
            id={id}
            type="url"
            inputMode="url"
            className="input"
            placeholder={placeholder}
            value={value}
            onChange={(event) => handleChange(event.target.value)}
            aria-invalid={Boolean(error)}
          />
        </div>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="mb-0.5 rounded-lg border border-surface-border p-2 text-zinc-400 transition-colors hover:border-red-500/60 hover:text-red-300"
            aria-label="移除這張圖片"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      {trimmed === '' ? null : canPreview ? (
        // 用戶提供的任意網址，無法預先設定 next/image 的 remotePatterns
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={trimmed}
          alt="圖片預覽"
          onError={() => setPreviewFailed(true)}
          className="h-24 w-40 rounded-lg border border-surface-border object-cover"
        />
      ) : (
        <p className="flex items-center gap-1.5 text-xs text-amber-300">
          <ImageOff className="h-3.5 w-3.5" />
          {previewFailed ? '圖片載入失敗，請確認網址可公開存取' : '網址格式不正確，無法預覽'}
        </p>
      )}
    </div>
  );
}
