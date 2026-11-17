import type { DocumentBlock } from '@/documents/model'

function Block({ block }: { block: DocumentBlock }) {
  switch (block.kind) {
    case 'heading': {
      // El h1 de la página es el título del documento.
      const Tag = block.level === 1 ? 'h2' : block.level === 2 ? 'h3' : 'h4'
      return <Tag>{block.text}</Tag>
    }
    case 'paragraph':
      return <p>{block.text}</p>
    case 'list':
      return (
        <ul>
          {block.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )
    case 'table':
      return (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {block.headers.map((header) => (
                  <th key={header} scope="col">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
  }
}

/** Muestra en pantalla los mismos bloques que se exportan a Word. */
export function BlocksView({ blocks }: { blocks: DocumentBlock[] }) {
  return (
    <article className="document">
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </article>
  )
}
