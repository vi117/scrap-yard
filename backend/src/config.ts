import Ajv, { JSONSchemaType } from "ajv";
import * as logger from "std/log";
import * as JSONC from "std/jsonc";
import { crypto } from "std/crypto";

export interface ConfigSchema {
    hosts: string[];
    staticFileHost: string[];
    sessionSecret: string;
    password: string;
    port?: number;
    allowAnonymous: boolean;
    sessionPath: string;
    shareDocStorePath: string;
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
            nullable: true,
        },
        allowAnonymous: {
            type: "boolean",
        },
        sessionPath: {
            type: "string",
        },
        shareDocStorePath: {
            type: "string",
        },
        password: {
            type: "string",
        },
    },
    required: [
        "hosts",
        "staticFileHost",
        "sessionSecret",
        "allowAnonymous",
        "sessionPath",
        "shareDocStorePath",
        "password",
    ],
};

const ajv = new Ajv();
const validate = ajv.compile(configSchema);

export class ConfigError extends Error {
    constructor(message: string, public data: typeof validate.errors) {
        super(message);
    }
}

export function configLoad(data: string): ConfigSchema {
    const json = JSONC.parse(data);
    if (validate(json)) {
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
    "allowAnonymous": true,
    /* session path */
    "sessionPath": ".scrap-yard/session.json",
    /* session doc path */
    "shareDocStorePath": ".scrap-yard/session_doc.json",
    /* password */
    "password": "secret"
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
