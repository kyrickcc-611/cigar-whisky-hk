'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Save } from 'lucide-react';
import { ImageUrlField } from '@/components/admin/ImageUrlField';
import { useAuth } from '@/hooks/useAuth';
import { BAR_TAGS, BAR_TYPES, DISTRICTS, WEEKDAYS } from '@/lib/constants';
import { createBar, updateBar } from '@/lib/repositories/bars';
import { IMAGE_UPLOAD_DISABLED_MESSAGE } from '@/lib/services/images';
import { buildMapsDirectionsLink, cn } from '@/lib/utils';
import {
  EMPTY_BAR_FORM_VALUES,
  MAX_BAR_IMAGES,
  formValuesToBarInput,
  validateBarForm,
  type BarFormErrors,
  type BarFormValues,
} from '@/lib/validators/bar';
import type { DayHours, WeekdayKey } from '@/types';

interface BarFormProps {
  mode: 'create' | 'edit';
  /** edit 模式必填 */
  barId?: string;
  initialValues?: BarFormValues;
}

/** 新增／編輯酒吧表單（單一組件同時處理兩種模式） */
export function BarForm({ mode, barId, initialValues }: BarFormProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [values, setValues] = useState<BarFormValues>(initialValues ?? EMPTY_BAR_FORM_VALUES);
  const [errors, setErrors] = useState<BarFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** 更新單一欄位並清除其錯誤（含巢狀路徑） */
  function setField<K extends keyof BarFormValues>(key: K, value: BarFormValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => clearErrorPaths(previous, String(key)));
  }

  function updateDay(key: WeekdayKey, patch: Partial<DayHours>) {
    setValues((previous) => ({
      ...previous,
      openingHours: {
        ...previous.openingHours,
        [key]: { ...previous.openingHours[key], ...patch },
      },
    }));
    setErrors((previous) => clearErrorPaths(previous, `openingHours.${key}`));
  }

  function toggleTag(tag: string) {
    setValues((previous) => ({
      ...previous,
      tags: previous.tags.includes(tag)
        ? previous.tags.filter((item) => item !== tag)
        : [...previous.tags, tag],
    }));
  }

  function updateImageUrl(index: number, url: string) {
    setValues((previous) => {
      const imageUrls = [...previous.imageUrls];
      imageUrls[index] = url;
      return { ...previous, imageUrls };
    });
    setErrors((previous) => clearErrorPaths(previous, `imageUrls.${index}`));
  }

  function addImageUrl() {
    setValues((previous) =>
      previous.imageUrls.length >= MAX_BAR_IMAGES
        ? previous
        : { ...previous, imageUrls: [...previous.imageUrls, ''] },
    );
  }

  function removeImageUrl(index: number) {
    setValues((previous) => ({
      ...previous,
      imageUrls: previous.imageUrls.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  /** 用目前座標產生 Google Maps 連結 */
  function fillMapsLink() {
    const lat = Number(values.lat);
    const lng = Number(values.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setField('googleMapsLink', buildMapsDirectionsLink(lat, lng));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const result = validateBarForm(values);
    if (!result.success) {
      setErrors(result.errors);
      setFormError('表單有未填寫或格式不正確的欄位，請檢查後再儲存。');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!user) {
      setFormError('登入狀態已失效，請重新登入後再試。');
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const input = formValuesToBarInput(result.data);
      if (mode === 'edit' && barId) {
        await updateBar(barId, input);
      } else {
        await createBar(input, user.uid);
      }
      router.push('/admin/bars');
      router.refresh();
    } catch (error) {
      console.error('[admin] 儲存酒吧失敗', error);
      setFormError('儲存失敗：請確認你仍具備管理員權限（或網絡連線正常），然後再試一次。');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError ? (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
        >
          {formError}
        </p>
      ) : null}

      {/* 1. 基本資料 */}
      <section className="card space-y-4">
        <h2 className="text-sm font-semibold text-brand-200">基本資料</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bar-name" className="label">
              酒吧名稱 *
            </label>
            <input
              id="bar-name"
              className="input"
              placeholder="例：Cigar Emporium"
              value={values.name}
              onChange={(event) => setField('name', event.target.value)}
              aria-invalid={Boolean(errors.name)}
            />
            <FieldError message={errors.name} />
          </div>

          <div>
            <label htmlFor="bar-name-en" className="label">
              英文名稱
            </label>
            <input
              id="bar-name-en"
              className="input"
              placeholder="例：Cigar Emporium"
              value={values.nameEn}
              onChange={(event) => setField('nameEn', event.target.value)}
              aria-invalid={Boolean(errors.nameEn)}
            />
            <FieldError message={errors.nameEn} />
          </div>

          <div>
            <span className="label">類型 *</span>
            <div className="flex flex-wrap gap-2">
              {BAR_TYPES.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors',
                    values.type === option.value
                      ? 'border-brand-500 bg-brand-500/10 text-brand-200'
                      : 'border-surface-border text-zinc-300 hover:border-brand-500/50',
                  )}
                >
                  <input
                    type="radio"
                    name="bar-type"
                    value={option.value}
                    checked={values.type === option.value}
                    onChange={() => setField('type', option.value)}
                    className="sr-only"
                  />
                  {option.labelZh}
                </label>
              ))}
            </div>
            <FieldError message={errors.type} />
          </div>

          <div>
            <label htmlFor="bar-district" className="label">
              地區 *
            </label>
            <select
              id="bar-district"
              className="input"
              value={values.district}
              onChange={(event) => setField('district', event.target.value)}
            >
              {DISTRICTS.map((district) => (
                <option key={district.value} value={district.value}>
                  {district.labelZh}
                </option>
              ))}
            </select>
            <FieldError message={errors.district} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            className="h-4 w-4 accent-brand-500"
            checked={values.isActive}
            onChange={(event) => setField('isActive', event.target.checked)}
          />
          在網站公開顯示（取消勾選＝下架，只有管理員可見）
        </label>
      </section>

      {/* 2. 地址與位置 */}
      <section className="card space-y-4">
        <h2 className="text-sm font-semibold text-brand-200">地址與位置</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bar-address" className="label">
              地址 *
            </label>
            <input
              id="bar-address"
              className="input"
              placeholder="例：中環蘭桂坊 1 號 5 樓"
              value={values.address}
              onChange={(event) => setField('address', event.target.value)}
              aria-invalid={Boolean(errors.address)}
            />
            <FieldError message={errors.address} />
          </div>

          <div>
            <label htmlFor="bar-address-en" className="label">
              英文地址
            </label>
            <input
              id="bar-address-en"
              className="input"
              placeholder="例：5/F, 1 Lan Kwai Fong, Central"
              value={values.addressEn}
              onChange={(event) => setField('addressEn', event.target.value)}
            />
            <FieldError message={errors.addressEn} />
          </div>

          <div>
            <label htmlFor="bar-phone" className="label">
              電話
            </label>
            <input
              id="bar-phone"
              className="input"
              placeholder="例：+852 2123 4567"
              value={values.phone}
              onChange={(event) => setField('phone', event.target.value)}
            />
            <FieldError message={errors.phone} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="bar-lat" className="label">
                緯度 *
              </label>
              <input
                id="bar-lat"
                className="input"
                inputMode="decimal"
                placeholder="22.2793"
                value={values.lat}
                onChange={(event) => setField('lat', event.target.value)}
                aria-invalid={Boolean(errors.lat)}
              />
              <FieldError message={errors.lat} />
            </div>
            <div>
              <label htmlFor="bar-lng" className="label">
                經度 *
              </label>
              <input
                id="bar-lng"
                className="input"
                inputMode="decimal"
                placeholder="114.1628"
                value={values.lng}
                onChange={(event) => setField('lng', event.target.value)}
                aria-invalid={Boolean(errors.lng)}
              />
              <FieldError message={errors.lng} />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="bar-maps-link" className="label">
            Google Maps 連結
          </label>
          <div className="flex gap-2">
            <input
              id="bar-maps-link"
              className="input"
              placeholder="https://maps.app.goo.gl/..."
              value={values.googleMapsLink}
              onChange={(event) => setField('googleMapsLink', event.target.value)}
              aria-invalid={Boolean(errors.googleMapsLink)}
            />
            <button type="button" onClick={fillMapsLink} className="btn-secondary whitespace-nowrap">
              用座標產生
            </button>
          </div>
          <p className="mt-1.5 text-xs text-zinc-500">
            留空會自動用上面的座標產生導航連結。座標可在 Google Maps 右鍵 → 複製座標取得。
          </p>
          <FieldError message={errors.googleMapsLink} />
        </div>
      </section>

      {/* 3. 營業時間 */}
      <section className="card space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-brand-200">營業時間</h2>
          <p className="mt-1 text-xs text-zinc-500">
            若關門時間早於開門時間，代表跨午夜營業（例如 18:00 – 02:00）。
          </p>
        </div>

        <div className="divide-y divide-surface-border/60">
          {WEEKDAYS.map((weekday) => {
            const day = values.openingHours[weekday.key];
            const dayError =
              errors[`openingHours.${weekday.key}.open`] ??
              errors[`openingHours.${weekday.key}.close`];

            return (
              <div key={weekday.key} className="flex flex-wrap items-center gap-3 py-2">
                <span className="w-16 shrink-0 text-sm text-zinc-300">{weekday.labelZh}</span>

                <label className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand-500"
                    checked={day.closed}
                    onChange={(event) => updateDay(weekday.key, { closed: event.target.checked })}
                  />
                  休息
                </label>

                <input
                  type="time"
                  className="input w-32"
                  value={day.open}
                  disabled={day.closed}
                  onChange={(event) => updateDay(weekday.key, { open: event.target.value })}
                  aria-label={`${weekday.labelZh}開門時間`}
                />
                <span className="text-zinc-500">–</span>
                <input
                  type="time"
                  className="input w-32"
                  value={day.close}
                  disabled={day.closed}
                  onChange={(event) => updateDay(weekday.key, { close: event.target.value })}
                  aria-label={`${weekday.labelZh}關門時間`}
                />

                {dayError ? <span className="text-xs text-red-400">{dayError}</span> : null}
              </div>
            );
          })}
        </div>

        <div>
          <label htmlFor="bar-hours-note" className="label">
            營業時間備註
          </label>
          <input
            id="bar-hours-note"
            className="input"
            placeholder="例：公眾假期照常營業"
            value={values.openingHoursNote}
            onChange={(event) => setField('openingHoursNote', event.target.value)}
          />
          <FieldError message={errors.openingHoursNote} />
        </div>
      </section>

      {/* 4. 介紹與特色 */}
      <section className="card space-y-4">
        <h2 className="text-sm font-semibold text-brand-200">介紹與特色</h2>

        <div>
          <label htmlFor="bar-description" className="label">
            酒吧介紹
          </label>
          <textarea
            id="bar-description"
            className="input min-h-[7rem] resize-y"
            placeholder="例：位於中環的雪茄吧，提供超過 300 款單一麥芽威士忌及專業保濕房…"
            value={values.description}
            onChange={(event) => setField('description', event.target.value)}
          />
          <FieldError message={errors.description} />
        </div>

        <div>
          <span className="label">特色標籤</span>
          <div className="flex flex-wrap gap-2">
            {BAR_TAGS.map((tag) => {
              const checked = values.tags.includes(tag.value);
              return (
                <label
                  key={tag.value}
                  className={cn(
                    'cursor-pointer rounded-full border px-3 py-1.5 text-xs transition-colors',
                    checked
                      ? 'border-brand-500 bg-brand-500/15 text-brand-200'
                      : 'border-surface-border text-zinc-300 hover:border-brand-500/50',
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => toggleTag(tag.value)}
                  />
                  {tag.labelZh}
                </label>
              );
            })}
          </div>
          <FieldError message={errors.tags} />
        </div>
      </section>

      {/* 5. 圖片 */}
      <section className="card space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-brand-200">圖片</h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            {IMAGE_UPLOAD_DISABLED_MESSAGE}
          </p>
        </div>

        <ImageUrlField
          id="bar-cover-image"
          label="封面圖片網址"
          value={values.coverImageUrl}
          onChange={(next) => setField('coverImageUrl', next)}
          hint="留空時會自動使用第一張酒吧圖片。"
          error={errors.coverImageUrl}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="label mb-0">酒吧圖片（最多 {MAX_BAR_IMAGES} 張）</span>
            <button
              type="button"
              onClick={addImageUrl}
              disabled={values.imageUrls.length >= MAX_BAR_IMAGES}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              新增圖片
            </button>
          </div>

          {values.imageUrls.length === 0 ? (
            <p className="text-xs text-zinc-500">尚未加入圖片。</p>
          ) : (
            values.imageUrls.map((url, index) => (
              <ImageUrlField
                key={index}
                id={`bar-image-${index}`}
                label={`圖片 ${index + 1}`}
                value={url}
                onChange={(next) => updateImageUrl(index, next)}
                error={errors[`imageUrls.${index}`]}
                onRemove={() => removeImageUrl(index)}
              />
            ))
          )}

          <FieldError message={errors.imageUrls} />
        </div>
      </section>

      <div className="flex flex-col gap-2 pb-8 sm:flex-row sm:justify-end">
        <Link href="/admin/bars" className="btn-secondary sm:w-auto">
          取消
        </Link>
        <button type="submit" className="btn-primary sm:w-auto" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {submitting ? '儲存中…' : mode === 'edit' ? '儲存變更' : '新增酒吧'}
        </button>
      </div>
    </form>
  );
}

/** 清除某欄位（含巢狀路徑，例如 openingHours.mon.open）的錯誤 */
function clearErrorPaths(errors: BarFormErrors, prefix: string): BarFormErrors {
  const next = { ...errors };
  for (const path of Object.keys(next)) {
    if (path === prefix || path.startsWith(`${prefix}.`)) {
      delete next[path];
    }
  }
  return next;
}

/** 單一欄位的錯誤文字 */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-400">{message}</p>;
}
