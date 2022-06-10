import { Typography } from "@mui/material";
import { extname, join as pathJoin } from "path-browserify";
import { useEffect, useState } from "react";
import DocumentEditor from "../Component/Document";
import { Loading } from "../Component/Loading";
import { getFsManagerInstance } from "../Model/FsManager";
import { useAsync } from "../util/util";
import "../util/util.css";

function makeFsUrl(path: string) {
    // temporary hack to make the url work
    // TODO: fix this
    return "http://localhost:8000" + pathJoin("/fs", path);
}

function PageCover(props: {
    children: React.ReactNode;
}) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                backgroundColor: "#fafafa",
            }}
        >
            {props.children}
        </div>
    );
}

export function ImagePage(props: {
    path: string;
}) {
    const { path } = props;

    return (
        <PageCover>
            <img src={makeFsUrl(path)} alt={path} />
        </PageCover>
    );
}

export function VideoPage(props: {
    path: string;
}) {
    const { path } = props;

    return (
        <PageCover>
            <video src={makeFsUrl(path)} controls />
        </PageCover>
    );
}

export function AudioPage(props: {
    path: string;
}) {
    const { path } = props;

    return (
        <PageCover>
            <audio src={makeFsUrl(path)} controls />
        </PageCover>
    );
}

export function TextPage(props: {
    path: string;
}) {
    const { path } = props;

    const state = useAsync(
        async () => {
            const fsManager = await getFsManagerInstance();
            const res = await fsManager.get(path);
            return await res.text();
        },
        undefined,
        [path],
    );

    if (state.loading) {
        return <Loading />;
    }
    if (state.error) {
        if (state.error instanceof Error) {
            return (
                <PageCover>
                    <Typography variant="h5">
                        {state.error.message}
                    </Typography>
                </PageCover>
            );
        }
    }
    return <p style={{ padding: "1em" }}>{state.data}</p>;
}

export function Page(props: { path: string }) {
    const path = props.path;
    const ext = extname(path);
    if (path === "") {
        return (
            <div className="center_container">
                <Typography variant="h3">
                    Welcome to Scrap Yard: a web-based file manager.<br />
                    Please select a file or folder to view.
                </Typography>
            </div>
        );
    }
    switch (ext) {
        case ".syd":
            return <DocumentEditor path={path} />;
        case ".png":
        case ".jpg":
        case ".jpeg":
        case ".gif":
            return <ImagePage path={path} />;
        case ".mp4":
        case ".webm":
        case ".ogg":
        case ".mov":
            return <VideoPage path={path} />;
        case ".mp3":
        case ".wav":
        case ".flac":
        case ".aac":
            return <AudioPage path={path} />;
        case ".txt":
            return <TextPage path={path} />;
        case ".pdf":
        case ".md":
        case ".markdown":
        default:
            return (
                <div className="center_container">
                    <Typography variant="h2">
                        Viewer Not Exist: {path}
                    </Typography>
                </div>
            );
    }
}

export default Page;
