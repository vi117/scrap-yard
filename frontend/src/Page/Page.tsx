import { Box, Container, Paper, Skeleton, Typography } from "@mui/material";
import { extname, join as pathJoin } from "path-browserify";
import DocumentEditor from "../Component/Document";
import { getFsManagerInstance } from "../Model/FsManager";
import { makeEndpointURL } from "../Model/serverInfo";
import { useAsync } from "../util/util";
import "../util/util.css";

function makeFsUrl(path: string) {
    return makeEndpointURL(pathJoin("/fs", path)).href;
}

function PageCover(props: {
    children: React.ReactNode;
}) {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "calc(100vh - 64px)",
            }}
        >
            {props.children}
        </Box>
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

    const [state, _] = useAsync(
        async () => {
            const fsManager = await getFsManagerInstance();
            const res = await fsManager.get(path);
            return await res.text();
        },
        undefined,
        [path],
    );

    if (state.loading) {
        return <Skeleton />;
    }
    if (state.error) {
        if (state.error instanceof Error) {
            return (
                <PageCover>
                    <Typography color="text.primary" variant="h5">
                        {state.error.message}
                    </Typography>
                </PageCover>
            );
        } else {
            console.error(state.error);
        }
    }
    return (
        <Container sx={{ padding: "1em" }}>
            <Typography color="text.primary" variant="body1">
                {state.data}
            </Typography>;
        </Container>
    );
}

export function Page(props: { path: string }) {
    const path = props.path;
    const ext = extname(path);
    if (path === "") {
        return (
            <Box className="center_container">
                <Typography color="text.primary" variant="h3">
                    Welcome to Scrap Yard: a web-based notebook.<br />
                    Please select a file or folder to view.
                </Typography>
            </Box>
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
                <Box className="center_container">
                    <Typography color="text.primary" variant="h2">
                        Viewer Not Exist: {path}
                    </Typography>
                </Box>
            );
    }
}

export default Page;
