import { useEffect, useReducer } from "react";

export function isRelative(path: string): boolean {
    return path.startsWith(".");
}

type AsyncDataAction<T> = {
    type: "loading";
} | {
    type: "success";
    payload: T;
} | {
    type: "error";
    error: unknown;
};

type AsyncDataState<T> = {
    loading: true;
    data: null;
    error: null;
} | {
    loading: false;
    data: T;
    error: null;
} | {
    loading: false;
    data: null;
    error: unknown;
};

function AsyncDataReducer<T>(
    state: AsyncDataState<T>,
    action: AsyncDataAction<T>,
): AsyncDataState<T> {
    const type = action.type;
    switch (type) {
        case "loading":
            return {
                loading: true,
                data: null,
                error: null,
            };
        case "success":
            return {
                loading: false,
                data: action.payload,
                error: null,
            };
        case "error":
            return {
                loading: false,
                data: null,
                error: action.error,
            };
        default: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _exhaustiveCheck: never = type;
        }
    }
    throw new Error("unreachable");
}

export function useAsync<T>(
    fn: () => Promise<T>,
    cleanUp?: () => void,
    deps?: unknown[],
): [AsyncDataState<T>, () => void] {
    const [state, dispatch] = useReducer(
        AsyncDataReducer as (
            state: AsyncDataState<T>,
            action: AsyncDataAction<T>,
        ) => AsyncDataState<T>,
        {
            loading: false,
            data: null,
            error: null,
        },
    );

    const dipatchData = async () => {
        dispatch({ type: "loading" });
        try {
            const data = await fn();
            dispatch({ type: "success", payload: data });
        } catch (error) {
            dispatch({ type: "error", error });
        }
    };

    useEffect(() => {
        dipatchData();
        return cleanUp;
    }, deps);

    const reload = () => {
        dipatchData();
    };

    return [state, reload];
}
