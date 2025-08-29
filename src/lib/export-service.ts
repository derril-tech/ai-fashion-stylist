import PDFDocument from 'pdfkit';
import { monitorImageProcessing } from './observability';

export type LookbookFormat = 'json' | 'pdf';

export interface LookbookItem {
  id: string;
  title: string;
  brand?: string;
  category: string;
  colors?: string[];
  imageUrl?: string;
}

export interface LookbookOutfit {
  id: string;
  name: string;
  rationale?: string;
  items: LookbookItem[];
}

export interface LookbookTheme {
  name: 'modern' | 'minimal' | 'classic';
  accentColor: string; // hex
}

export const THEME_PRESETS: Record<string, LookbookTheme> = {
  modern: { name: 'modern', accentColor: '#7C3AED' },
  minimal: { name: 'minimal', accentColor: '#374151' },
  classic: { name: 'classic', accentColor: '#1F2937' },
};

export async function generateLookbookJSON(
  outfits: LookbookOutfit[],
  theme: LookbookTheme
): Promise<Buffer> {
  const span = monitorImageProcessing('generateLookbookJSON', { outfits: outfits.length });
  const payload = {
    generatedAt: new Date().toISOString(),
    theme,
    outfits,
  };
  span.end();
  return Buffer.from(JSON.stringify(payload, null, 2), 'utf-8');
}

export async function generateLookbookPDF(
  outfits: LookbookOutfit[],
  theme: LookbookTheme
): Promise<Buffer> {
  const span = monitorImageProcessing('generateLookbookPDF', { outfits: outfits.length });
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  const chunks: Buffer[] = [];
  doc.on('data', (c) => chunks.push(c));

  // Cover page
  doc
    .fillColor(theme.accentColor)
    .fontSize(24)
    .text('AI Fashion Stylist — Lookbook', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).fillColor('#111827').text(`Theme: ${theme.name}`, { align: 'center' });
  doc.moveDown(2);

  outfits.forEach((outfit, idx) => {
    if (idx > 0) doc.addPage();
    doc.fillColor(theme.accentColor).fontSize(18).text(outfit.name);
    if (outfit.rationale) {
      doc.moveDown(0.5);
      doc.fillColor('#374151').fontSize(10).text(outfit.rationale);
    }
    doc.moveDown();

    // Items table-like listing
    outfit.items.forEach((item) => {
      doc
        .fillColor('#111827')
        .fontSize(12)
        .text(`• ${item.title} — ${item.brand || '—'} (${item.category})`);
      if (item.colors && item.colors.length) {
        doc.fillColor('#6B7280').fontSize(10).text(`  Colors: ${item.colors.join(', ')}`);
      }
      doc.moveDown(0.5);
    });
  });

  doc.end();

  await new Promise<void>((resolve) => doc.on('end', () => resolve()));
  span.end();
  return Buffer.concat(chunks);
}

export function getThemePreset(name?: string): LookbookTheme {
  return THEME_PRESETS[name || 'modern'] || THEME_PRESETS.modern;
}
