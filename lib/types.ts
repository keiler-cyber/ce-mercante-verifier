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
}
