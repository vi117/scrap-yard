import { marked } from "marked";

const MarkdownRenderer = (props: { text: string | undefined }) => {
    let text = props.text;
    if (text === undefined) {
        text = "";
    }
    return <div dangerouslySetInnerHTML={{ __html: marked.parse(text) }} />;
};

export default MarkdownRenderer;
