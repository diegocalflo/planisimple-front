import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import type { DocumentBlock } from '@/documents/model'

// Primitivas de Word comunes a todos los exportadores. Solo las importan los
// exportadores de las actividades, así docx viaja en el chunk diferido de cada una.

const HEADINGS = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
} as const

function tableRow(cells: string[], isHeader: boolean): TableRow {
  return new TableRow({
    tableHeader: isHeader,
    children: cells.map(
      (text) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold: isHeader })] })] }),
    ),
  })
}

function blockToDocx(block: DocumentBlock): (Paragraph | Table)[] {
  switch (block.kind) {
    case 'heading':
      return [new Paragraph({ text: block.text, heading: HEADINGS[block.level] })]
    case 'paragraph':
      return [new Paragraph(block.text)]
    case 'list':
      return block.items.map((item) => new Paragraph({ text: item, bullet: { level: 0 } }))
    case 'table':
      return [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [tableRow(block.headers, true), ...block.rows.map((row) => tableRow(row, false))],
        }),
        new Paragraph(''),
      ]
  }
}

export function blocksToDocx(title: string, blocks: DocumentBlock[]): Promise<Blob> {
  const document = new Document({
    title,
    sections: [
      {
        children: [new Paragraph({ text: title, heading: HeadingLevel.TITLE }), ...blocks.flatMap(blockToDocx)],
      },
    ],
  })
  return Packer.toBlob(document)
}
