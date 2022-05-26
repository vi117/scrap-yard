import katex from "katex";
import "katex/dist/katex.min.css";
import { useEffect, useRef } from "react";

export function KatexRenderer(props: { tex: string }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (ref.current) {
            katex.render(props.tex, ref.current, {
                displayMode: true,
                throwOnError: false,
            });
        }
    }, [props.tex]);
    return <div ref={ref}></div>;
}
