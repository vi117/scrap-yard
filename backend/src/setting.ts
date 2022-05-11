import Ajv, { Schema, ValidateFunction } from "ajv";
import * as logger from "std/log"

const ajv = new Ajv();

const settingSchemas: Record<string, {
  name: string;
  schema: Schema;
  validate: ValidateFunction;
}> = {};

const setting: Record<string, any> = {};

function getDefaultPath(): string {
  return Deno.env.get("SETTING_PATH") || "./setting.json";
}

let settingPath = getDefaultPath();

/**
 * Register a setting
 * @param name key name of setting
 * @param schema schema of setting
 *
 * @example
 * ```ts
 * import {registerSetting} from "./setting.ts";
 * registerSetting("test", {
 *   type: "object",
 *   properties: {
 *   a: {type: "string"},
 *   b: {type: "number"}
 *   }
 * });
 * ```
 */
export function register(name: string, schema: Schema) {
  settingSchemas[name] = {
    name,
    schema,
    validate: ajv.compile(schema),
  };
}

export async function load() {
  const data = await Deno.readTextFile(settingPath);
  const json = JSON.parse(data);
  for (const key in json) {
    if (key in settingSchemas) {
      const v = json[key];
      if (settingSchemas[key].validate(v)) {
        setting[key] = v;
      }
      else {
        logger.warning(`invalid setting: ${key} ${JSON.stringify(v)}`, v);
        throw new Error(`invalid setting: ${key}`);
      }
    }
  }
  for (const key in settingSchemas) {
    if (!(key in setting)) {
      setting[key] = {};
    }
  }
}

/**
 * get setting
 * @param name key of setting
 * @returns setting value
 */
export function get<T>(name: string): T {
  const v = setting[name];
  if (!v) {
    throw new Error(`key ${name} not found in setting file`);
  }
  return v as T;
}

/**
 * set setting
 * @param name key of setting
 * @param value value of setting
 * @returns setting value
 * @throws Error if key not found
 * @throws Error if value is invalid
 * @example
 * ```ts
 * import {setSetting} from "./setting.ts";
 * setSetting("test", {a: "a", b: 1});
 * ```
 */
export function set<T>(name: string, value: T): T {
  if (!(name in settingSchemas)) {
    throw new Error(`key ${name} not found in setting file`);
  }
  if (settingSchemas[name].validate(value)) {
    setting[name] = value;
  }
  else {
    throw new Error(`invalid setting: ${name}`);
  }
  return value;
}

/**
 * save setting to path
 * @param name key of setting
 * @returns setting value
 * @throws Error if setting is not registered
 * @throws Error if setting is invalid
 * @throws Error if setting file is not writable
 */
export async function save(): Promise<void> {
  await Deno.writeTextFile(settingPath, JSON.stringify(setting, undefined, 2));
}

/**
 * set path of setting
 * @param path path to setting file
 */
export function setPath(path: string) {
  settingPath = path;
}

/**
 * get path of setting
 * @returns path to setting file
 */
export function getPath(): string {
  return settingPath;
}
