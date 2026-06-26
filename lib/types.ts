export type ComparisonStatus = 'OK' | 'DISCREPANTE' | 'ILEGÍVEL';

export interface FieldComparison {
  category: string;
  field: string;
  ceValue: string;
  blValue: string;
  status: ComparisonStatus;
  observation: string;
}

export interface AnalysisSummary {
  totalFields: number;
  okCount: number;
  discrepantCount: number;
  illegibleCount: number;
  imageQualityAlert: string | null;
}

export interface AnalysisResult {
  ceNumber: string;
  summary: AnalysisSummary;
  comparisons: FieldComparison[];
  confiancaLeituraCE?: number; // 0–100: quanto a IA conseguiu ler o CE Mercante
  confiancaLeituraBL?: number; // 0–100: quanto a IA conseguiu ler o BL
}
