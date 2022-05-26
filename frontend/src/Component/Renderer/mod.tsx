import CsvRenderer from "./csvRenderer";
import MarkdownRenderer from "./markdownRenderer";

export function renderView(t: string, content: string) {
    switch (t) {
        case "text":
            return <div>{content}</div>;
        case "csv":
            return <CsvRenderer content={content} />;
        case "md":
            return <MarkdownRenderer text={content} />;
        case "image":
            return <img style={{ width: "100%" }} src={content} />;
        case "video":
            return <video style={{ width: "100%" }} controls src={content} />;
        case "audio":
            return <audio style={{ width: "100%" }} controls src={content} />;
        case "rawhtml":
            return <div dangerouslySetInnerHTML={{ __html: content }} />;
        case "katex":
            return <KatexRenderer tex={content} />;
        default:
            return <>error: invalid type: {t} content: {content}</>;
    }
}

export default renderView;
