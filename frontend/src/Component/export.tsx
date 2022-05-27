import { Chunk as ChunkType, DocumentObject } from "model";
import * as ReactDOMServer from "react-dom/server";
import { renderView } from "./Renderer/mod";

export function exportToHTML(doc: DocumentObject): string {
    const renderedChunks: JSX.Element[] = doc.chunks.map((c: ChunkType) =>
        renderView(c.type, c.content)
    );

    const renderedDocument = (
        <>
            {renderedChunks}
        </>
    );

    return ReactDOMServer.renderToString(renderedDocument);
}
