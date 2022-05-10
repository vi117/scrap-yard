import { marked } from "marked";

const markdownRenderer = (text: string| undefined) => {
  if (text === undefined) {
    text = "";
  }
  return <div dangerouslySetInnerHTML={{ __html: marked.parse(text) }} />;
};

export default markdownRenderer;
