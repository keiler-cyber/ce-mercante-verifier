'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import type { FieldComparison, ComparisonStatus } from '@/lib/types';

function StatusBadge({ status }: { status: ComparisonStatus }) {
  if (status === 'OK') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
      <CheckCircle2 className="w-3 h-3" /> OK
    </span>
  );
  if (status === 'DISCREPANTE') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
      <XCircle className="w-3 h-3" /> DISCREPANTE
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">
      <AlertTriangle className="w-3 h-3" /> ILEGÍVEL
    </span>
  );
}

function CategorySection({ category, fields }: { category: string; fields: FieldComparison[] }) {
  const [open, setOpen] = useState(true);
  const discrepantCount = fields.filter(f => f.status === 'DISCREPANTE').length;

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-700">{category}</span>
          <span className="text-xs text-gray-400">{fields.length} campo(s)</span>
          {discrepantCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
              {discrepantCount} crítico(s)
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="divide-y divide-gray-50">
          {fields.map((f, i) => (
            <div
              key={i}
              className={`px-4 py-3 ${f.status === 'DISCREPANTE' ? 'bg-red-50/40' : f.status === 'ILEGÍVEL' ? 'bg-orange-50/40' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-600 mb-2">{f.field}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium mb-0.5">CE MERCANTE</p>
                      <p className={`text-xs font-medium ${f.ceValue === 'Não localizado' ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                        {f.ceValue || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium mb-0.5">BILL OF LADING</p>
                      <p className={`text-xs font-medium ${f.blValue === 'Não localizado' ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                        {f.blValue || '—'}
                      </p>
                    </div>
                  </div>
                  {f.observation && f.status !== 'OK' && (
                    <p className="text-[11px] text-gray-500 mt-2 italic">{f.observation}</p>
                  )}
                </div>
                <div className="flex-shrink-0 pt-0.5">
                  <StatusBadge status={f.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type Filter = 'all' | 'DISCREPANTE' | 'OK' | 'ILEGÍVEL';

export function ComparisonTable({ comparisons }: { comparisons: FieldComparison[] }) {
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = filter === 'all' ? comparisons : comparisons.filter(c => c.status === filter);

  const categories = Array.from(new Set(filtered.map(c => c.category)));

  const counts = {
    all: comparisons.length,
    DISCREPANTE: comparisons.filter(c => c.status === 'DISCREPANTE').length,
    OK: comparisons.filter(c => c.status === 'OK').length,
    ILEGÍVEL: comparisons.filter(c => c.status === 'ILEGÍVEL').length,
  };

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: counts.all },
    { key: 'DISCREPANTE', label: 'Discrepantes', count: counts.DISCREPANTE },
    { key: 'OK', label: 'Conformes', count: counts.OK },
    { key: 'ILEGÍVEL', label: 'Ilegíveis', count: counts.ILEGÍVEL },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-base font-bold text-gray-900 mb-4">Tabela de Conformidade — Campo a Campo</h2>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {filters.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === key
                ? key === 'DISCREPANTE' ? 'bg-red-600 text-white'
                  : key === 'OK' ? 'bg-green-600 text-white'
                  : key === 'ILEGÍVEL' ? 'bg-orange-500 text-white'
                  : 'bg-[#003d4d] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-400">
          Nenhum campo nesta categoria.
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map(cat => (
            <CategorySection
              key={cat}
              category={cat}
              fields={filtered.filter(f => f.category === cat)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
