import Ajv, { JSONSchemaType } from "ajv";
import * as logger from "std/log";
import * as JSONC from "std/jsonc";
import { crypto } from "std/crypto";

interface ConfigSchema {
    hosts: string[];
    staticFileHost: string[];
    sessionSecret: string;
    port: number;
    allowAnonymous: boolean;
}

const configSchema: JSONSchemaType<ConfigSchema> = {
    type: "object",
    properties: {
        hosts: {
            type: "array",
            items: {
                type: "string",
            },
        },
        staticFileHost: {
            type: "array",
            items: {
                type: "string",
            },
        },
        sessionSecret: {
            type: "string",
        },
        port: {
            type: "number",
        },
        allowAnonymous: {
            type: "boolean",
        },
    },
    required: [],
};

const ajv = new Ajv();
const validate = ajv.compile(configSchema);

export class ConfigError extends Error {
    constructor(message: string, public data: typeof validate.errors) {
        super(message);
    }
}

export function configLoad(data: string) {
    const json = JSONC.parse(data);
    if (validate(json)) {
        json.hosts ??= [];
        json.staticFileHost ??= json.hosts;
        json.sessionSecret ??= Deno.env.get("SESSION_SECRET") ??
            crypto.randomUUID();
        json.port ??= parseInt(Deno.env.get("PORT") ?? "8080");
        return json;
    } else {
        logger.warning(`invalid config: ${validate.errors}`);
        throw new ConfigError("invalid config", validate.errors);
    }
}

const defaultConfigText = `{
    /* hosts of this server */
    "hosts": [],
    /* hosts of static files server */
    "staticFileHost": [],
    /* session secret */
    "sessionSecret": "${crypto.randomUUID()}",
    /* port to serve */
    "port": 8000,
    /* allow anonymous user*/
    "allowAnonymous": true
}`;

export async function configLoadFrom(path: string) {
    let data;
    try {
        data = await Deno.readTextFile(path);
    } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
            logger.info(`config file not found: ${path}`);
            data = defaultConfigText;
            await Deno.writeTextFile(path, data);
        } else throw e;
    }
    return configLoad(data);
}
