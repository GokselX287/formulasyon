'use client';

import { useState } from 'react';

type Item = { id: number; content: string };

type Props = {
  formulationId: number;
  category: string;
  label: string;
  initialItems: Item[];
  placeholder?: string;
  hidden?: boolean;
};

export default function ChipList({ formulationId, category, label, initialItems, placeholder, hidden }: Props) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [input, setInput] = useState('');

  async function add() {
    const trimmed = input.trim();
    if (!trimmed) return;
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formulation_id: formulationId, category, content: trimmed }),
    });
    const data = await res.json();
    setItems((prev) => [...prev, { id: data.id, content: trimmed }]);
    setInput('');
  }

  async function remove(id: number) {
    await fetch(`/api/items?id=${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--ink-soft)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {label}
        </span>
        {hidden && (
          <span style={{
            fontSize: '10px',
            padding: '1px 6px',
            background: 'var(--line)',
            color: 'var(--ink-soft)',
            borderRadius: '4px',
          }}>
            danisana gorunmez
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
        {items.map((item) => (
          <span
            key={item.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: 'var(--accent-soft)',
              border: '1px solid var(--line-strong)',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'var(--accent-deep)',
            }}
          >
            {item.content}
            <button
              onClick={() => remove(item.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--accent-deep)',
                padding: 0,
                fontSize: '14px',
                lineHeight: 1,
              }}
            >
              x
            </button>
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder ?? 'Ekle...'}
          style={{
            flex: 1,
            padding: '7px 11px',
            border: '1px solid var(--line-strong)',
            borderRadius: '6px',
            fontSize: '13px',
            background: 'var(--surface)',
            color: 'var(--ink)',
          }}
        />
        <button
          onClick={add}
          style={{
            padding: '7px 14px',
            background: 'var(--accent-soft)',
            border: '1px solid var(--line-strong)',
            borderRadius: '6px',
            fontSize: '13px',
            color: 'var(--accent-deep)',
            cursor: 'pointer',
          }}
        >
          Ekle
        </button>
      </div>
    </div>
  );
}
