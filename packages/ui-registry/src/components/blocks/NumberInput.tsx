'use client';

import React, { useEffect, useState } from 'react';
import { useLocale, useTranslations } from '@ecommerce/i18n/src/react';

/**
 * NumberInput — ô nhập số dùng chung cho admin + storefront (TODO 13, 14).
 *
 * - `type="text"` + inputMode numeric: người dùng gõ chữ vẫn thấy được nhưng
 *   component báo lỗi NGAY DƯỚI input (thay vì input number im lặng nuốt ký tự).
 * - Hiển thị dấu ngăn nghìn theo ngôn ngữ hiện tại khi rời ô (blur):
 *   vi → 45.000 / 45.000,15 · en → 45,000 / 45,000.15. Giá trị gửi ra ngoài
 *   (`onValueChange`) luôn là number thô.
 * - min/max/integer validate tại chỗ, message i18n namespace `validation`.
 */
export interface NumberInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'min' | 'max'> {
    value: number | null | undefined;
    onValueChange: (value: number | null) => void;
    min?: number;
    max?: number;
    /** Cho phép phần thập phân (mặc định true). Quantity/stock nên đặt false. */
    allowDecimal?: boolean;
    /** Hậu tố hiển thị trong ô, vd "đ" — thuần trang trí. */
    suffix?: string;
    /** Message override; không truyền thì dùng message i18n mặc định. */
    errorMessage?: string;
    /** Class cho <input>; class ngoài cùng đặt qua wrapperClassName. */
    wrapperClassName?: string;
}

function localeSeparators(locale: string) {
    // vi: 1.234.567,89 — en: 1,234,567.89
    return locale === 'vi'
        ? { group: '.', decimal: ',' }
        : { group: ',', decimal: '.' };
}

function formatNumber(value: number, locale: string): string {
    return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
        maximumFractionDigits: 10,
    }).format(value);
}

/** Parse chuỗi người dùng gõ theo separators của locale; NaN nếu không phải số. */
function parseLocalized(raw: string, locale: string): number {
    const { group, decimal } = localeSeparators(locale);
    const normalized = raw
        .split(group).join('')
        .replace(decimal, '.');
    if (!/^-?\d*(\.\d*)?$/.test(normalized) || normalized === '' || normalized === '-') return NaN;
    return Number(normalized);
}

export function NumberInput({
    value,
    onValueChange,
    min,
    max,
    allowDecimal = true,
    suffix,
    errorMessage,
    className,
    wrapperClassName,
    onBlur,
    ...rest
}: NumberInputProps) {
    const locale = useLocale();
    const t = useTranslations('validation');
    const [text, setText] = useState<string>(
        typeof value === 'number' && Number.isFinite(value) ? formatNumber(value, locale) : '',
    );
    const [error, setError] = useState<string | null>(null);
    const [focused, setFocused] = useState(false);

    // Đồng bộ khi value đổi từ ngoài (reset form, load data) — không ghi đè lúc đang gõ.
    useEffect(() => {
        if (focused) return;
        setText(typeof value === 'number' && Number.isFinite(value) ? formatNumber(value, locale) : '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, locale]);

    const validate = (raw: string): { parsed: number | null; err: string | null } => {
        if (raw.trim() === '') return { parsed: null, err: null };
        const parsed = parseLocalized(raw.trim(), locale);
        if (Number.isNaN(parsed)) return { parsed: null, err: errorMessage || t('number') };
        if (!allowDecimal && !Number.isInteger(parsed)) return { parsed: null, err: errorMessage || t('integer') };
        if (min != null && parsed < min) return { parsed: null, err: errorMessage || t('min', { min: formatNumber(min, locale) }) };
        if (max != null && parsed > max) return { parsed: null, err: errorMessage || t('max', { max: formatNumber(max, locale) }) };
        return { parsed, err: null };
    };

    const handleChange = (raw: string) => {
        setText(raw);
        const { parsed, err } = validate(raw);
        setError(err);
        onValueChange(err ? null : parsed);
    };

    return (
        <div className={wrapperClassName}>
            <div className="relative">
                <input
                    {...rest}
                    type="text"
                    inputMode={allowDecimal ? 'decimal' : 'numeric'}
                    value={text}
                    onChange={(e) => handleChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={(e) => {
                        setFocused(false);
                        const { parsed, err } = validate(text);
                        if (!err && parsed != null) setText(formatNumber(parsed, locale));
                        onBlur?.(e);
                    }}
                    aria-invalid={!!error}
                    className={className}
                />
                {suffix && (
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-60">
                        {suffix}
                    </span>
                )}
            </div>
            {error && (
                <p role="alert" className="mt-1 text-xs text-red-500">
                    {error}
                </p>
            )}
        </div>
    );
}
