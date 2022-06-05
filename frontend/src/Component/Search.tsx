import { Button, Dialog, Input, List, ListItem } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import { Chunk } from "model";

type SearchResult = {
    id: string;
    index: number;
    input: string;
};

// simple function that searches word in chunks.
function search_word(chunks: Chunk[], target: string): SearchResult[] {
    const result: SearchResult[] = [];

    for (const chunk of chunks) {
        const matched = chunk.content.matchAll(new RegExp(target, "g"));
        for (const r of matched) {
            result.push({ id: chunk.id, index: r.index, input: r.input });
        }
    }

    return result;
}

function SearchResult(props: {
    input: string;
    results: SearchResult[];
    onSelect: (r: SearchResult) => void;
}) {
    const result_list = props.results.map((result, i) => {
        const { id, index, input } = result;
        const sampleStart = Math.max(0, index - 200);
        const sampleEnd = Math.min(index + 200, input.length);

        const textBefore = input.substring(sampleStart, index);
        const text = props.input;
        const textAfter = input.substring(index + text.length, sampleEnd);

        const sample = (
            <>
                {(sampleStart > 0 ? "..." : "") + textBefore}
                <span className="highlight">{text}</span>
                {textAfter + (sampleEnd < input.length ? "..." : "")}
            </>
        );

        return (
            <a
                key={i}
                href={"#chunk-" + id}
                onClick={() => props.onSelect(result)}
            >
                <ListItem>{sample}</ListItem>
            </a>
        );
    });

    return <List>{result_list}</List>;
}

function SearchDialog(props: {
    open: boolean;
    onClose: () => void;
    search: (target: string) => SearchResult[];
}) {
    const [input, setInput] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);

    const inputRef = useRef<HTMLInputElement>(null);

    const onClick = () => {
        const inp = inputRef.current?.value ?? "";
        const rs = props.search(inp);

        setInput(inp);
        setResults(rs);
    };

    useEffect(() => {
        setInput("");
        setResults([]);
    }, [props.open]);

    return (
        <Dialog open={props.open} onClose={props.onClose}>
            <Input inputRef={inputRef} id="searchbox" type="search" />
            <Input type="button" value="Search" onClick={onClick} />
            {input == ""
                ? null
                : (
                    <SearchResult
                        input={input}
                        results={results}
                        onSelect={() => props.onClose()}
                    />
                )}
        </Dialog>
    );
}

export function Search(props: {
    chunks: Chunk[];
}) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setOpen(true)}>Search</Button>
            <SearchDialog
                open={open}
                onClose={() => setOpen(false)}
                search={(s) => search_word(props.chunks, s)}
            />
        </>
    );
}

export default Search;
