import type { ActivityResult } from '@/activities/_shared/definition'
import { blocksToDocx } from '@/documents/export/docx'
import { toBlocks } from './blocks'

/** Word desde el contenido del documento, con los mismos bloques que el Viewer. */
export function exportDocx(title: string, result: ActivityResult): Promise<Blob> {
  return blocksToDocx(title, toBlocks(result))
}
