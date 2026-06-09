'use client';

import { Document, Page, Text, View, StyleSheet, Image as PDFImage } from '@react-pdf/renderer';
import type { AnalysisResult, FieldComparison } from '@/lib/types';

// ─── Cores ──────────────────────────────────────────────────────────────────
const NAVY    = '#003d4d';
const TEAL    = '#4A9BAA';
const GREEN   = '#166534';
const GREEN_BG = '#f0fdf4';
const RED     = '#991b1b';
const RED_BG  = '#fff1f2';
const ORANGE  = '#9a3412';
const ORANGE_BG = '#fff7ed';
const GRAY    = '#64748b';
const LIGHT   = '#f1f5f9';
const BORDER  = '#cbd5e1';
const WHITE   = '#ffffff';

const LOGO_URL = typeof window !== 'undefined'
  ? `${window.location.origin}/brasporto-logo.png`
  : '/brasporto-logo.png';

const BG_URL = typeof window !== 'undefined'
  ? `${window.location.origin}/port-bg.png`
  : '/port-bg.png';

// ─── Estilos ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: WHITE,
    fontSize: 7,
  },

  // Header com background image
  headerWrap: { position: 'relative', height: 90 },
  headerBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, objectFit: 'cover', opacity: 0.18 },
  headerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: NAVY, opacity: 0.88,
  },
  headerContent: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 28, paddingVertical: 14,
  },
  logo: { width: 110, height: 36, objectFit: 'contain' },
  headerDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 16 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 13, fontWeight: 'bold', color: WHITE, letterSpacing: 0.5 },
  headerSub: { fontSize: 7.5, color: TEAL, marginTop: 3 },
  headerRight: { alignItems: 'flex-end' },
  headerDate: { fontSize: 6.5, color: 'rgba(255,255,255,0.7)', marginBottom: 3 },
  headerBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
    fontSize: 7, fontWeight: 'bold',
  },

  // Corpo
  body: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },

  // Seção de arquivos
  filesRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  fileBox: {
    flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 6,
    padding: 7, backgroundColor: LIGHT,
  },
  fileLabel: { fontSize: 5.5, fontWeight: 'bold', color: GRAY, textTransform: 'uppercase', marginBottom: 2 },
  fileName: { fontSize: 6.5, color: NAVY, fontWeight: 'bold' },

  // Cards de resumo
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  summaryCard: {
    flex: 1, borderRadius: 8, padding: 10,
    alignItems: 'center', borderWidth: 1,
  },
  summaryNum: { fontSize: 22, fontWeight: 'bold', marginBottom: 2 },
  summaryLabel: { fontSize: 6, textAlign: 'center' },

  // Alert
  alertBox: {
    flexDirection: 'row', gap: 6, borderRadius: 6,
    padding: 7, marginBottom: 12, borderWidth: 1,
  },
  alertText: { fontSize: 6.5, flex: 1 },

  // ─── Duas colunas ─────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 8.5, fontWeight: 'bold', color: WHITE,
    backgroundColor: NAVY, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 5, marginBottom: 8,
  },

  twoColRow: { flexDirection: 'row', gap: 8 },
  col: { flex: 1 },

  // Card de divergência
  discCard: {
    borderWidth: 1, borderColor: '#fca5a5', borderRadius: 6,
    padding: 7, marginBottom: 6, backgroundColor: '#fff5f5',
  },
  discHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  discField: { fontSize: 7, fontWeight: 'bold', color: RED, flex: 1, paddingRight: 4 },
  discBadge: {
    fontSize: 5.5, fontWeight: 'bold', color: RED,
    backgroundColor: RED_BG, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 2,
  },
  discRow: { flexDirection: 'row', gap: 6, marginBottom: 2 },
  discColLabel: { fontSize: 5.5, color: GRAY, width: 20, fontWeight: 'bold' },
  discColValue: { fontSize: 6.5, color: '#1e293b', flex: 1, fontWeight: 'bold' },
  discObs: { fontSize: 6, color: GRAY, fontStyle: 'italic', marginTop: 2 },

  // Tabela
  tableWrap: { marginTop: 10 },
  catHeader: {
    backgroundColor: TEAL, flexDirection: 'row',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 1,
  },
  catLabel: { fontSize: 7, fontWeight: 'bold', color: WHITE, flex: 1 },
  catCount: { fontSize: 6, color: 'rgba(255,255,255,0.8)' },

  tableHeader: {
    flexDirection: 'row', backgroundColor: LIGHT,
    paddingHorizontal: 6, paddingVertical: 3,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  tRow: {
    flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 4,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  tRowDisc: { backgroundColor: '#fff5f5' },
  tRowIleg: { backgroundColor: '#fff7ed' },
  tRowAlt:  { backgroundColor: '#f8fafc' },

  cField:  { width: '22%', paddingRight: 3 },
  cCE:     { width: '28%', paddingRight: 3 },
  cBL:     { width: '28%', paddingRight: 3 },
  cStatus: { width: '10%', alignItems: 'center' },
  cObs:    { flex: 1, paddingLeft: 3 },

  thText: { fontSize: 5.5, fontWeight: 'bold', color: GRAY, textTransform: 'uppercase' },
  tdText: { fontSize: 6.5, color: '#1e293b' },
  tdMuted: { fontSize: 6.5, color: '#94a3b8', fontStyle: 'italic' },
  tdObs:  { fontSize: 6, color: GRAY, fontStyle: 'italic' },

  badgeOK:   { fontSize: 6, fontWeight: 'bold', color: GREEN, backgroundColor: GREEN_BG, borderRadius: 3, paddingHorizontal: 3, paddingVertical: 1.5 },
  badgeDISC: { fontSize: 6, fontWeight: 'bold', color: RED, backgroundColor: RED_BG, borderRadius: 3, paddingHorizontal: 3, paddingVertical: 1.5 },
  badgeILEG: { fontSize: 6, fontWeight: 'bold', color: ORANGE, backgroundColor: ORANGE_BG, borderRadius: 3, paddingHorizontal: 3, paddingVertical: 1.5 },

  // Footer
  footer: {
    position: 'absolute', bottom: 14, left: 24, right: 24,
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 6,
  },
  footerText: { fontSize: 6, color: '#94a3b8' },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Badge({ status }: { status: FieldComparison['status'] }) {
  if (status === 'OK')          return <Text style={s.badgeOK}>OK</Text>;
  if (status === 'DISCREPANTE') return <Text style={s.badgeDISC}>CRÍT.</Text>;
  return <Text style={s.badgeILEG}>ILEG.</Text>;
}

function rowStyle(f: FieldComparison, idx: number) {
  if (f.status === 'DISCREPANTE') return [s.tRow, s.tRowDisc];
  if (f.status === 'ILEGÍVEL')    return [s.tRow, s.tRowIleg];
  return idx % 2 === 1 ? [s.tRow, s.tRowAlt] : [s.tRow];
}

// Divide array em dois sub-arrays para duas colunas
function splitColumns<T>(arr: T[]): [T[], T[]] {
  const mid = Math.ceil(arr.length / 2);
  return [arr.slice(0, mid), arr.slice(mid)];
}

// ─── Tabela de categoria ─────────────────────────────────────────────────────
function CategoryTable({ category, fields }: { category: string; fields: FieldComparison[] }) {
  return (
    <View wrap={false} style={{ marginBottom: 6 }}>
      <View style={s.catHeader}>
        <Text style={s.catLabel}>{category}</Text>
        <Text style={s.catCount}>{fields.length} campo(s)</Text>
      </View>
      <View style={s.tableHeader}>
        <Text style={[s.cField, s.thText]}>Campo</Text>
        <Text style={[s.cCE, s.thText]}>CE Mercante</Text>
        <Text style={[s.cBL, s.thText]}>Bill of Lading</Text>
        <Text style={[s.cStatus, s.thText]}>Status</Text>
        <Text style={[s.cObs, s.thText]}>Observação</Text>
      </View>
      {fields.map((f, i) => (
        <View key={i} style={rowStyle(f, i)}>
          <Text style={[s.cField, s.tdText]}>{f.field}</Text>
          <Text style={[s.cCE, f.ceValue === 'Não localizado' ? s.tdMuted : s.tdText]}>{f.ceValue}</Text>
          <Text style={[s.cBL, f.blValue === 'Não localizado' ? s.tdMuted : s.tdText]}>{f.blValue}</Text>
          <View style={s.cStatus}><Badge status={f.status} /></View>
          <Text style={[s.cObs, s.tdObs]}>{f.observation}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export function ReportPDF({
  result,
  ceFileName,
  blFileName,
}: {
  result: AnalysisResult;
  ceFileName: string;
  blFileName: string;
}) {
  const { summary, comparisons, ceNumber } = result;
  const pct = summary.totalFields > 0 ? Math.round((summary.okCount / summary.totalFields) * 100) : 0;
  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const allOk = summary.discrepantCount === 0;
  const reportTitle = ceNumber && ceNumber !== 'Não localizado'
    ? `CONFERÊNCIA DO CE Nº ${ceNumber}`
    : 'RELATÓRIO DE CONFORMIDADE DOCUMENTAL';

  const discrepant = comparisons.filter(c => c.status === 'DISCREPANTE');
  const categories = Array.from(new Set(comparisons.map(c => c.category)));

  // Divide divergências em 2 colunas
  const [discLeft, discRight] = splitColumns(discrepant);
  // Divide categorias em 2 colunas para a tabela completa
  const [catLeft, catRight] = splitColumns(categories);

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Header com background ── */}
        <View style={s.headerWrap}>
          <PDFImage src={BG_URL} style={s.headerBg} />
          <View style={s.headerOverlay} />
          <View style={s.headerContent}>
            <PDFImage src={LOGO_URL} style={s.logo} />
            <View style={s.headerDivider} />
            <View style={s.headerText}>
              <Text style={s.headerTitle}>{reportTitle}</Text>
              <Text style={s.headerSub}>CE Mercante vs Bill of Lading — Auditoria de Importação Marítima</Text>
            </View>
            <View style={s.headerRight}>
              <Text style={s.headerDate}>{today}</Text>
              <Text style={[s.headerBadge, {
                backgroundColor: allOk ? '#166534' : RED,
                color: WHITE,
              }]}>
                {allOk ? '✓ SEM DIVERGÊNCIAS' : `⚠ ${summary.discrepantCount} DIVERGÊNCIA(S) CRÍTICA(S)`}
              </Text>
            </View>
          </View>
        </View>

        <View style={s.body}>

          {/* ── Arquivos ── */}
          <View style={s.filesRow}>
            <View style={s.fileBox}>
              <Text style={s.fileLabel}>CE Mercante</Text>
              <Text style={s.fileName}>{ceFileName || '—'}</Text>
            </View>
            <View style={s.fileBox}>
              <Text style={s.fileLabel}>Bill of Lading</Text>
              <Text style={s.fileName}>{blFileName || '—'}</Text>
            </View>
            <View style={[s.fileBox, { flex: 0.6 }]}>
              <Text style={s.fileLabel}>Conformidade</Text>
              <Text style={[s.fileName, { color: allOk ? GREEN : RED }]}>{pct}%</Text>
            </View>
          </View>

          {/* ── Cards de resumo ── */}
          <View style={s.summaryRow}>
            <View style={[s.summaryCard, { borderColor: BORDER, backgroundColor: LIGHT }]}>
              <Text style={[s.summaryNum, { color: NAVY }]}>{summary.totalFields}</Text>
              <Text style={[s.summaryLabel, { color: GRAY }]}>CAMPOS{'\n'}ANALISADOS</Text>
            </View>
            <View style={[s.summaryCard, { borderColor: '#86efac', backgroundColor: GREEN_BG }]}>
              <Text style={[s.summaryNum, { color: GREEN }]}>{summary.okCount}</Text>
              <Text style={[s.summaryLabel, { color: GREEN }]}>EM{'\n'}CONFORMIDADE</Text>
            </View>
            <View style={[s.summaryCard, { borderColor: '#fca5a5', backgroundColor: RED_BG }]}>
              <Text style={[s.summaryNum, { color: RED }]}>{summary.discrepantCount}</Text>
              <Text style={[s.summaryLabel, { color: RED }]}>DISCREPANTES{'\n'}(CRÍTICOS)</Text>
            </View>
            {summary.illegibleCount > 0 && (
              <View style={[s.summaryCard, { borderColor: '#fdba74', backgroundColor: ORANGE_BG }]}>
                <Text style={[s.summaryNum, { color: ORANGE }]}>{summary.illegibleCount}</Text>
                <Text style={[s.summaryLabel, { color: ORANGE }]}>ILEGÍVEIS</Text>
              </View>
            )}
          </View>

          {/* ── Alerta de qualidade ── */}
          {summary.imageQualityAlert && (
            <View style={[s.alertBox, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
              <Text style={[s.alertText, { color: '#92400e' }]}>⚠ {summary.imageQualityAlert}</Text>
            </View>
          )}

          {/* ── Divergências em duas colunas ── */}
          {discrepant.length > 0 && (
            <View style={{ marginBottom: 14 }}>
              <Text style={s.sectionTitle}>DIVERGÊNCIAS CRÍTICAS ({discrepant.length})</Text>
              <View style={s.twoColRow}>
                <View style={s.col}>
                  {discLeft.map((f, i) => (
                    <View key={i} style={s.discCard}>
                      <View style={s.discHeader}>
                        <Text style={s.discField}>{f.category} › {f.field}</Text>
                        <Text style={s.discBadge}>CRÍTICO</Text>
                      </View>
                      <View style={s.discRow}>
                        <Text style={s.discColLabel}>CE:</Text>
                        <Text style={s.discColValue}>{f.ceValue}</Text>
                      </View>
                      <View style={s.discRow}>
                        <Text style={s.discColLabel}>BL:</Text>
                        <Text style={s.discColValue}>{f.blValue}</Text>
                      </View>
                      {f.observation && <Text style={s.discObs}>{f.observation}</Text>}
                    </View>
                  ))}
                </View>
                <View style={s.col}>
                  {discRight.map((f, i) => (
                    <View key={i} style={s.discCard}>
                      <View style={s.discHeader}>
                        <Text style={s.discField}>{f.category} › {f.field}</Text>
                        <Text style={s.discBadge}>CRÍTICO</Text>
                      </View>
                      <View style={s.discRow}>
                        <Text style={s.discColLabel}>CE:</Text>
                        <Text style={s.discColValue}>{f.ceValue}</Text>
                      </View>
                      <View style={s.discRow}>
                        <Text style={s.discColLabel}>BL:</Text>
                        <Text style={s.discColValue}>{f.blValue}</Text>
                      </View>
                      {f.observation && <Text style={s.discObs}>{f.observation}</Text>}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* ── Tabela completa em duas colunas ── */}
          <Text style={s.sectionTitle}>TABELA DE CONFORMIDADE COMPLETA</Text>
          <View style={s.twoColRow}>
            <View style={s.col}>
              {catLeft.map(cat => (
                <CategoryTable key={cat} category={cat} fields={comparisons.filter(c => c.category === cat)} />
              ))}
            </View>
            <View style={s.col}>
              {catRight.map(cat => (
                <CategoryTable key={cat} category={cat} fields={comparisons.filter(c => c.category === cat)} />
              ))}
            </View>
          </View>

        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Brasporto International Logistics — Documento Confidencial</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
}
