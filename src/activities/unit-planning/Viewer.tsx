import type { ActivityResult } from '@/activities/_shared/definition'
import { BlocksView } from '@/documents/BlocksView'
import { toBlocks } from './blocks'

export function Viewer({ result }: { result: ActivityResult }) {
  return <BlocksView blocks={toBlocks(result)} />
}
