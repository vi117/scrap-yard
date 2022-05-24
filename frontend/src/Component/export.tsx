import { Chunk as ChunkType, DocumentObject } from "model";
import * as ReactDOMServer from "react-dom/server";
import { render_view } from "./Chunk";

export function exportToHTML(doc: DocumentObject): string {
    const renderedChunks: JSX.Element[] = doc.chunks.map((c: ChunkType) =>
        render_view(c.type, c.content)
    );

    const renderedDocument = (
        <>
            {renderedChunks}
        </>
    );

    return ReactDOMServer.renderToString(renderedDocument);
}
