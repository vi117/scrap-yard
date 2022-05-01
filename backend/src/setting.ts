import Ajv, { Schema, ValidateFunction } from "ajv";

const ajv = new Ajv();

const setting: Record<string, {
  name: string;
  schema: Schema;
  validate: ValidateFunction;
}> = {};

/**
 * register a setting
 * @param name key name of setting
 * @param schema schema of setting
 *
 * @example
 * ```ts
 * import {registerSetting} from "./setting.ts";
 * registerSetting("test", {
 *   type: "object",
 *  properties: {
 *     a: {type: "string"},
 *    b: {type: "number"}
 * }
 * });
 * ```
 */
export function registerSetting(name: string, schema: Schema) {
  setting[name] = {
    name,
    schema,
    validate: ajv.compile(schema),
  };
}
/**
 * load setting from file
 * @param name key of setting
 * @returns setting value
 */
export async function loadSetting<T>(name: string): Promise<T> {
  const settingPath = Deno.env.get("SETTING_PATH") || "./setting.json";
  const data = await Deno.readTextFile(settingPath);
  const json = JSON.parse(data);
  const v = json[name];
  const field = setting[name];
  if (!v) {
    throw new Error(`key ${name} not found in setting file`);
  }
  if (!field) {
    throw new Error(`field '${field}' is not registered`);
  }
  const validate = field.validate;
  if (!validate(v)) {
    throw new Error(`setting ${field} invalid`);
  }
  return v as T;
}
