export interface ExtractedData {
  date: string | null;
  amount: number | null;
  vendor: string | null;
  category: string | null;
  confidence_score: number | null;
}

export interface SavedRecord extends ExtractedData {
  id: string;
  sourceText?: string;
  sourceImageName?: string;
  parsedAt: string;
}

export interface SampleTemplate {
  id: string;
  name: string;
  description: string;
  text: string;
}
