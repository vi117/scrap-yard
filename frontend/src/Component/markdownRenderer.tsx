import { marked } from "marked";

const markdownRenderer = (text: string) => {
  return <div dangerouslySetInnerHTML={{ __html: marked.parse(text) }} />;
};

export default markdownRenderer;
