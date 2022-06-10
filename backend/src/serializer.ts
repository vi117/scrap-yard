import * as log from "std/log";

// deno-lint-ignore no-explicit-any
const reconstructor: { [key: string]: (value: any) => any } = {};

// deno-lint-ignore no-explicit-any
export function serializedReviver(_key: string, value: any): any {
    if (typeof value === "object" && value !== null && "__type__" in value) {
        if (value.__type__ in reconstructor) {
            return reconstructor[value.__type__](value);
        } else {
            log.warning(`Unknown type ${value.__type__} in serialized data`);
            log.debug(`Unknown type ${Deno.inspect(value)}`);
        }
    }
    return value;
}

// deno-lint-ignore no-explicit-any
export function registerReconstructor(type: string, func: (value: any) => any) {
    if (type in reconstructor) {
        throw new Error(`${type} is already registered`);
    }
    reconstructor[type] = func;
}
