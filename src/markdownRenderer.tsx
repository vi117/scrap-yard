import { marked } from "marked";
import { Fragment } from "react";

const markdownRenderer = (text: string) => {
  return <div dangerouslySetInnerHTML={{ __html: marked.parse(text) }} />;
};

export default markdownRenderer;
