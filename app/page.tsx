'use client';

import { useState, useRef } from 'react';
import { Loader2, FileText, AlertCircle, CheckCircle2, XCircle, AlertTriangle, Upload, RotateCcw, Download } from 'lucide-react';
import type { AnalysisResult, FieldComparison } from '@/lib/types';
import { ComparisonTable } from '@/components/ComparisonTable';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReportPDF } from '@/components/ReportPDF';

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
        'border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all select-none',
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
            <p className="text-xs font-semibold text-green-700 truncate">{file.name}</p>
            <p className="text-[10px] text-green-600">{(file.size / 1024).toFixed(0)} KB — clique para substituir</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#4A9BAA]/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#4A9BAA]" />
          </div>
          <p className="text-xs font-semibold text-gray-700">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
          </p>
          <p className="text-[10px] text-gray-400">{sublabel}</p>
          <span className="mt-1 px-3 py-1 bg-[#4A9BAA] text-white rounded-lg text-[10px] font-medium">Selecionar PDF</span>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ result }: { result: AnalysisResult }) {
  const { summary } = result;
  const pct = summary.totalFields > 0 ? Math.round((summary.okCount / summary.totalFields) * 100) : 0;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900">Resumo da Análise</h2>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${summary.discrepantCount === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {summary.discrepantCount === 0 ? 'SEM DIVERGÊNCIAS' : `${summary.discrepantCount} DIVERGÊNCIA(S) CRÍTICA(S)`}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 rounded-xl bg-gray-50">
          <p className="text-2xl font-bold text-gray-900">{summary.totalFields}</p>
          <p className="text-xs text-gray-500 mt-0.5">Campos Analisados</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-green-50">
          <p className="text-2xl font-bold text-green-700 flex items-center justify-center gap-1"><CheckCircle2 className="w-5 h-5" />{summary.okCount}</p>
          <p className="text-xs text-green-600 mt-0.5">Em Conformidade</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-red-50">
          <p className="text-2xl font-bold text-red-700 flex items-center justify-center gap-1"><XCircle className="w-5 h-5" />{summary.discrepantCount}</p>
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

export default function Home() {
  const [step, setStep] = useState<Step>('upload');
  const [ceDadosFile, setCeDadosFile] = useState<File | null>(null);
  const [ceItemFile, setCeItemFile] = useState<File | null>(null);
  const [blFile, setBlFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);

  const canAnalyze = ceDadosFile && blFile && step === 'upload';

  async function handleAnalyze() {
    if (!ceDadosFile || !blFile) return;
    setError('');
    setStep('analyzing');
    try {
      const ceFiles = [ceDadosFile, ceItemFile].filter(Boolean) as File[];
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
    setCeDadosFile(null); setCeItemFile(null); setBlFile(null);
    setResult(null); setError(''); setStep('upload');
  }

  const discrepantFields: FieldComparison[] = result?.comparisons.filter(c => c.status === 'DISCREPANTE') ?? [];
  const ceFileNames = [ceDadosFile?.name, ceItemFile?.name].filter(Boolean).join(' + ');
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
      <header className="sticky top-0 z-10 bg-white shadow-md">
        <div className="max-w-5xl mx-auto px-8 py-5 flex items-center gap-6">
          <img src="/brasporto-logo.png" alt="Brasporto" className="h-40 w-auto" />
          <div className="w-px h-28 bg-gray-200" />
          <div>
            <p className="text-lg font-bold text-[#003d4d] tracking-wide">CE Mercante vs BL</p>
            <p className="text-xs text-[#4A9BAA] mt-0.5 font-medium">Verificador de Conformidade Documental</p>
          </div>
          {step === 'results' && result && (
            <div className="ml-auto flex items-center gap-3">
              <button onClick={handleReset} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition">
                <RotateCcw className="w-3.5 h-3.5" /> Nova Análise
              </button>
              <PDFDownloadLink
                document={<ReportPDF result={result} ceFileName={ceFileNames} blFileName={blFile?.name ?? ''} />}
                fileName={pdfFileName}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#003d4d] hover:bg-[#004d60] text-white rounded-lg text-xs font-semibold transition"
              >
                {({ loading: l }) => l ? 'Gerando...' : <><Download className="w-3.5 h-3.5" /> Baixar PDF</>}
              </PDFDownloadLink>
            </div>
          )}
        </div>
        {/* Faixa de destaque teal */}
        <div className="h-1 bg-gradient-to-r from-[#003d4d] via-[#4A9BAA] to-[#003d4d]" />
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6 relative z-10">

        {step !== 'results' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900">Verificação CE Mercante vs BL</h1>
              <p className="text-sm text-gray-500 mt-1">Envie os documentos para comparação automática campo a campo. Toda divergência real é classificada como crítica.</p>
            </div>

            {error && (
              <div className="mb-6 flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Erro na análise</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* CE Mercante */}
            <div className="mb-5 p-5 bg-blue-50/40 border border-blue-100 rounded-2xl">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                CE Mercante <span className="text-red-400">*</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FileDrop label="CE Dados Básicos" sublabel="Cabeçalho geral do CE (PDF)" file={ceDadosFile} onFile={setCeDadosFile} required />
                <FileDrop label="CE Item" sublabel="Detalhes de carga e mercadoria (PDF)" file={ceItemFile} onFile={setCeItemFile} />
              </div>
              {!ceItemFile && <p className="text-[10px] text-blue-500 mt-2">CE Item recomendado para análise completa de mercadoria e containers.</p>}
            </div>

            {/* BL */}
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                Bill of Lading (BL) <span className="text-red-400">*</span>
              </p>
              <FileDrop label="Bill of Lading" sublabel="Documento emitido pelo armador (PDF)" file={blFile} onFile={setBlFile} required />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="w-full py-4 bg-[#003d4d] hover:bg-[#004d60] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm"
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
            <h2 className="text-lg font-bold text-gray-900 mb-2">Analisando documentos...</h2>
            <p className="text-sm text-gray-500">A IA está lendo e comparando todos os campos.<br />Isso pode levar alguns segundos.</p>
          </div>
        )}

        {step === 'results' && result && (
          <div ref={resultRef} className="space-y-6">
            {/* Título da conferência */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Conferência</p>
                <h2 className="text-xl font-bold text-[#003d4d]">
                  {ceNumber ? `CE Nº ${ceNumber}` : 'CE Mercante'}
                </h2>
              </div>
              <span className="text-xs text-gray-400">{new Date().toLocaleDateString('pt-BR')}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {[ceDadosFile, ceItemFile].filter(Boolean).map((f, i) => (
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
                <h3 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Divergências Críticas ({discrepantFields.length})
                </h3>
                <div className="space-y-2">
                  {discrepantFields.map((f, i) => (
                    <div key={i} className="bg-white rounded-xl border border-red-100 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-red-700">{f.category} › {f.field}</span>
                        <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">CRÍTICO</span>
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
              <button onClick={handleReset} className="flex-1 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl transition text-sm font-medium flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" /> Nova Análise
              </button>
              <PDFDownloadLink
                document={<ReportPDF result={result} ceFileName={ceFileNames} blFileName={blFile?.name ?? ''} />}
                fileName={pdfFileName}
                className="flex-1 py-3 bg-[#003d4d] hover:bg-[#004d60] text-white rounded-xl transition text-sm font-bold flex items-center justify-center gap-2"
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
