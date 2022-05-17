import { Chunk as ChunkType, DocumentObject } from "model";
import * as ReactDOMServer from "react-dom/server";
import { render_view } from "./Chunk";

export function exportToHTML(doc: DocumentObject) {
  const renderedChunks: HTMLElement[] = doc.chunks.map((c: ChunkType) => render_view(c.type, c.content));

  const renderedDocument = (
    <>
      <h1>{doc.title}</h1>
      {renderedChunks}
    </>
  );

  return ReactDOMServer.renderToString(renderedDocument);
}
