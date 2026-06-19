'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, FileText, AlertCircle, CheckCircle2, XCircle, AlertTriangle, Upload, RotateCcw, Download, LogOut } from 'lucide-react';
import type { AnalysisResult, FieldComparison } from '@/lib/types';
import { ComparisonTable } from '@/components/ComparisonTable';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReportPDF } from '@/components/ReportPDF';
import { useAuth } from '@/lib/auth-context';

const VERSION = '26.06.18';

type Step = 'upload' | 'analyzing' | 'results';

function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function FileDrop({
  label,
  sublabel,
  file,
  onFile,
  required,
}: {
  label: string;
  sublabel: string;
  file: File | null;
  onFile: (f: File) => void;
  required?: boolean;
}) {
  const [drag, setDrag] = useState(false);
  const inputId = `drop-${label.replace(/[\s/()]/g, '-')}`;

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => {
        e.preventDefault();
        setDrag(false);
        const f = Array.from(e.dataTransfer.files).find(f => f.type === 'application/pdf');
        if (f) onFile(f);
      }}
      onClick={() => document.getElementById(inputId)?.click()}
      className={[
        'border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all select-none',
        drag ? 'border-[#4A9BAA] bg-[#f0f9fb]' : '',
        file ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-[#4A9BAA] hover:bg-[#f0f9fb]',
      ].join(' ')}
    >
      <input id={inputId} type="file" accept=".pdf" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
      />
      {file ? (
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div className="text-left min-w-0 flex-1">
            <p className="text-xs font-medium text-green-700 truncate">{file.name}</p>
            <p className="text-[10px] text-green-600">{(file.size / 1024).toFixed(0)} KB — clique para substituir</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-8 h-8 rounded-full bg-[#4A9BAA]/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-[#4A9BAA]" />
          </div>
          <p className="text-xs font-medium text-gray-700">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
          </p>
          <p className="text-[10px] text-gray-400">{sublabel}</p>
          <span className="mt-0.5 px-3 py-1 bg-[#4A9BAA] text-white rounded-lg text-[10px] font-medium">Selecionar PDF</span>
        </div>
      )}
    </div>
  );
}

function MultiFileDrop({
  label,
  sublabel,
  files,
  onAdd,
  onRemove,
}: {
  label: string;
  sublabel: string;
  files: File[];
  onAdd: (f: File) => void;
  onRemove: (i: number) => void;
}) {
  const [drag, setDrag] = useState(false);
  const inputId = `drop-multi-${label.replace(/[\s/()]/g, '-')}`;

  return (
    <div className="space-y-2">
      {files.map((f, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-green-700 truncate">{f.name}</p>
            <p className="text-[10px] text-green-600">{(f.size / 1024).toFixed(0)} KB</p>
          </div>
          <button type="button" onClick={() => onRemove(i)}
            className="text-gray-400 hover:text-red-500 transition flex-shrink-0" title="Remover">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      ))}
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => {
          e.preventDefault(); setDrag(false);
          Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf').forEach(onAdd);
        }}
        onClick={() => document.getElementById(inputId)?.click()}
        className={[
          'border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all select-none',
          drag ? 'border-[#4A9BAA] bg-[#f0f9fb]' : 'border-gray-200 bg-gray-50 hover:border-[#4A9BAA] hover:bg-[#f0f9fb]',
        ].join(' ')}
      >
        <input id={inputId} type="file" accept=".pdf" multiple className="hidden"
          onChange={e => { Array.from(e.target.files ?? []).forEach(onAdd); e.target.value = ''; }}
        />
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-8 h-8 rounded-full bg-[#4A9BAA]/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-[#4A9BAA]" />
          </div>
          <p className="text-xs font-medium text-gray-700">
            {files.length > 0 ? '+ Adicionar outro CE Item' : label}
          </p>
          <p className="text-[10px] text-gray-400">{sublabel}</p>
          <span className="mt-0.5 px-3 py-1 bg-[#4A9BAA] text-white rounded-lg text-[10px] font-medium">Selecionar PDF</span>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ result }: { result: AnalysisResult }) {
  const { summary } = result;
  const pct = summary.totalFields > 0 ? Math.round((summary.okCount / summary.totalFields) * 100) : 0;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-medium text-gray-900">Resumo da Análise</h2>
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${summary.discrepantCount === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {summary.discrepantCount === 0 ? 'SEM DIVERGÊNCIAS' : `${summary.discrepantCount} DIVERGÊNCIA(S) CRÍTICA(S)`}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 rounded-xl bg-gray-50">
          <p className="text-2xl font-medium text-gray-900">{summary.totalFields}</p>
          <p className="text-xs text-gray-500 mt-0.5">Campos Analisados</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-green-50">
          <p className="text-2xl font-medium text-green-700 flex items-center justify-center gap-1"><CheckCircle2 className="w-5 h-5" />{summary.okCount}</p>
          <p className="text-xs text-green-600 mt-0.5">Em Conformidade</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-red-50">
          <p className="text-2xl font-medium text-red-700 flex items-center justify-center gap-1"><XCircle className="w-5 h-5" />{summary.discrepantCount}</p>
          <p className="text-xs text-red-600 mt-0.5">Discrepantes (Críticos)</p>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${summary.discrepantCount === 0 ? 'bg-green-500' : 'bg-[#4A9BAA]'}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-1 text-right">{pct}% de conformidade</p>
      {summary.imageQualityAlert && (
        <div className="mt-4 flex gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-800">{summary.imageQualityAlert}</p>
        </div>
      )}
    </div>
  );
}

export default function AppPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [step, setStep] = useState<Step>('upload');
  const [ceDadosFile, setCeDadosFile] = useState<File | null>(null);
  const [ceItemFiles, setCeItemFiles] = useState<File[]>([]);
  const [blFile, setBlFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#4A9BAA] animate-spin" />
      </div>
    );
  }

  const canAnalyze = ceDadosFile && blFile && step === 'upload';

  async function handleAnalyze() {
    if (!ceDadosFile || !blFile) return;
    setError('');
    setStep('analyzing');
    try {
      const ceFiles = [ceDadosFile, ...ceItemFiles].filter(Boolean) as File[];
      const [cePdfBase64s, blPdfBase64] = await Promise.all([
        Promise.all(ceFiles.map(convertFileToBase64)),
        convertFileToBase64(blFile),
      ]);
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cePdfBase64s, blPdfBase64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao processar documentos');
      setResult(data as AnalysisResult);
      setStep('results');
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
      setStep('upload');
    }
  }

  function handleReset() {
    setCeDadosFile(null); setCeItemFiles([]); setBlFile(null);
    setResult(null); setError(''); setStep('upload');
  }

  const discrepantFields: FieldComparison[] = result?.comparisons.filter(c => c.status === 'DISCREPANTE') ?? [];
  const ceFileNames = [ceDadosFile?.name, ...ceItemFiles.map(f => f.name)].filter(Boolean).join(' + ');
  const ceNumber = result?.ceNumber && result.ceNumber !== 'Não localizado' ? result.ceNumber : null;
  const pdfFileName = ceNumber
    ? `CONFERENCIA DO CE NR ${ceNumber}.pdf`
    : `auditoria-ce-bl-${new Date().toISOString().split('T')[0]}.pdf`;

  return (
    <div className="min-h-screen bg-[#f8fafc] relative">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url(/port-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          opacity: 0.20,
          zIndex: 0,
        }}
      />
      <header className="sticky top-0 z-50 shadow-lg" style={{ background: '#002b38' }}>
        <div className="max-w-5xl mx-auto px-8 py-3.5 flex items-center gap-5">
          <img src="/brasporto-logo.png" alt="Brasporto"
            className="h-16 w-auto object-contain flex-shrink-0"
            style={{ filter: 'brightness(0) invert(1)', maxWidth: '240px' }}
          />
          <div className="w-px h-8 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <div className="flex-shrink-0">
            <p className="text-sm font-semibold text-white leading-tight">CE Mercante vs BL</p>
            <p className="text-[11px]" style={{ color: '#7dd3e8' }}>Verificador de Conformidade Documental</p>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <span className="text-xs font-mono select-none" style={{ color: 'rgba(255,255,255,0.4)' }}>v{VERSION}</span>
            {step === 'results' && result && (
              <>
                <button onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs transition"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'white'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'; }}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Nova Análise
                </button>
                <PDFDownloadLink
                  document={<ReportPDF result={result} ceFileName={ceFileNames} blFileName={blFile?.name ?? ''} />}
                  fileName={pdfFileName}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#4A9BAA] hover:bg-[#3d8594] text-white rounded-lg text-xs font-medium transition"
                >
                  {({ loading: l }) => l ? 'Gerando...' : <><Download className="w-3.5 h-3.5" /> Baixar PDF</>}
                </PDFDownloadLink>
              </>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                style={{ background: '#4A9BAA' }}>
                {user.email.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{user.email.split('@')[0]}</span>
              <button
                onClick={async () => { await logout(); router.push('/'); }}
                title="Sair"
                className="transition"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; }}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg,rgba(74,155,170,0.3),#4A9BAA,rgba(74,155,170,0.3))' }} />
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6 relative z-10">

        {step !== 'results' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="mb-6">
              <h1 className="text-xl font-medium text-gray-900">Verificação CE Mercante vs BL</h1>
              <p className="text-sm text-gray-500 mt-1">Envie os documentos para comparação automática campo a campo. Toda divergência real é classificada como crítica.</p>
            </div>

            {error && (
              <div className="mb-6 flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-900">Erro na análise</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="mb-5 p-5 bg-blue-50/40 border border-blue-100 rounded-2xl">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                CE Mercante <span className="text-red-400">*</span>
              </p>
              <div className="space-y-3">
                <FileDrop label="CE Dados Básicos" sublabel="Cabeçalho geral do CE (PDF)" file={ceDadosFile} onFile={setCeDadosFile} required />
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-2">CE Item(s) — opcional</p>
                  <MultiFileDrop
                    label="CE Item"
                    sublabel="Detalhes de carga e mercadoria — adicione um por container se necessário"
                    files={ceItemFiles}
                    onAdd={f => setCeItemFiles(prev => [...prev, f])}
                    onRemove={i => setCeItemFiles(prev => prev.filter((_, idx) => idx !== i))}
                  />
                </div>
              </div>
              {ceItemFiles.length === 0 && <p className="text-[10px] text-blue-500 mt-2">CE Item recomendado para análise completa de mercadoria e containers.</p>}
            </div>

            <div className="mb-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                Bill of Lading (BL) <span className="text-red-400">*</span>
              </p>
              <FileDrop label="Bill of Lading" sublabel="Documento emitido pelo armador (PDF)" file={blFile} onFile={setBlFile} required />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="w-full py-4 bg-[#003d4d] hover:bg-[#004d60] disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium rounded-xl transition flex items-center justify-center gap-2 text-sm"
            >
              <Upload className="w-4 h-4" />
              Iniciar Análise de Conformidade
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">Os documentos são processados pela IA e não são armazenados.</p>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <Loader2 className="w-12 h-12 text-[#4A9BAA] animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">Analisando documentos...</h2>
            <p className="text-sm text-gray-500">A IA está lendo e comparando todos os campos.<br />Isso pode levar alguns segundos.</p>
          </div>
        )}

        {step === 'results' && result && (
          <div ref={resultRef} className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-0.5">Conferência</p>
                <h2 className="text-xl font-medium text-[#003d4d]">
                  {ceNumber ? `CE Nº ${ceNumber}` : 'CE Mercante'}
                </h2>
              </div>
              <span className="text-xs text-gray-400">{new Date().toLocaleDateString('pt-BR')}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {[ceDadosFile, ...ceItemFiles].filter(Boolean).map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs text-gray-600">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-medium">CE {i + 1}:</span> {f!.name}
                </div>
              ))}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600">
                <FileText className="w-3.5 h-3.5 text-[#4A9BAA]" />
                <span className="font-medium">BL:</span> {blFile?.name}
              </div>
            </div>

            <SummaryCard result={result} />

            {discrepantFields.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <h3 className="text-sm font-medium text-red-800 mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Divergências Críticas ({discrepantFields.length})
                </h3>
                <div className="space-y-2">
                  {discrepantFields.map((f, i) => (
                    <div key={i} className="bg-white rounded-xl border border-red-100 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-red-700">{f.category} › {f.field}</span>
                        <span className="text-[10px] font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">CRÍTICO</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-gray-400">CE: </span><span className="text-gray-800 font-medium">{f.ceValue}</span></div>
                        <div><span className="text-gray-400">BL: </span><span className="text-gray-800 font-medium">{f.blValue}</span></div>
                      </div>
                      {f.observation && <p className="text-xs text-gray-500 mt-1.5 italic">{f.observation}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ComparisonTable comparisons={result.comparisons} />

            <div className="flex gap-3 pb-8">
              <button onClick={handleReset}
                className="flex-1 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl transition text-sm font-medium flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" /> Nova Análise
              </button>
              <PDFDownloadLink
                document={<ReportPDF result={result} ceFileName={ceFileNames} blFileName={blFile?.name ?? ''} />}
                fileName={pdfFileName}
                className="flex-1 py-3 bg-[#003d4d] hover:bg-[#004d60] text-white rounded-xl transition text-sm font-medium flex items-center justify-center gap-2"
              >
                {({ loading: l }) => l ? 'Gerando PDF...' : <><Download className="w-4 h-4" /> Baixar Relatório PDF</>}
              </PDFDownloadLink>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
