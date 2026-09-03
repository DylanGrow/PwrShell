import { PSProperty, PSMethod, PSObjectDefinition } from '../types';

export class PSObject {
  private _properties: Map<string, PSProperty> = new Map();
  private _methods: Map<string, PSMethod> = new Map();
  public typeNames: string[] = ['System.Object'];

  constructor(def?: PSObjectDefinition | Record<string, any>, typeName = 'PSCustomObject') {
    if (typeName) {
      this.typeNames.unshift(typeName);
    }

    if (def) {
      if ('properties' in def && typeof def.properties === 'object') {
        const pDef = def as PSObjectDefinition;
        for (const [key, val] of Object.entries(pDef.properties)) {
          this.setProperty(key, val);
        }
        if (pDef.methods) {
          for (const [key, fn] of Object.entries(pDef.methods)) {
            this.setMethod(key, fn);
          }
        }
        if (pDef.typeName) {
          this.typeNames.unshift(pDef.typeName);
        }
      } else {
        for (const [key, val] of Object.entries(def)) {
          this.setProperty(key, val);
        }
      }
    }
  }

  public setProperty(name: string, value: any, typeName?: string): void {
    const key = name.toLowerCase();
    const propType = typeName || (value === null ? 'Null' : typeof value);
    this._properties.set(key, {
      name,
      value,
      typeName: propType.charAt(0).toUpperCase() + propType.slice(1)
    });
  }

  public getProperty(name: string): any {
    const key = name.toLowerCase();
    const prop = this._properties.get(key);
    return prop !== undefined ? prop.value : undefined;
  }

  public hasProperty(name: string): boolean {
    return this._properties.has(name.toLowerCase());
  }

  public getProperties(): PSProperty[] {
    return Array.from(this._properties.values());
  }

  public setMethod(name: string, execute: (...args: any[]) => any, definition = 'void Method()'): void {
    const key = name.toLowerCase();
    this._methods.set(key, {
      name,
      execute,
      definition
    });
  }

  public getMethod(name: string): PSMethod | undefined {
    return this._methods.get(name.toLowerCase());
  }

  public getMethods(): PSMethod[] {
    return Array.from(this._methods.values());
  }

  public toPlainObject(): Record<string, any> {
    const obj: Record<string, any> = {};
    for (const prop of this._properties.values()) {
      obj[prop.name] = prop.value;
    }
    return obj;
  }

  public toString(): string {
    const name = this.getProperty('Name') || this.getProperty('Id');
    if (name !== undefined) {
      return String(name);
    }
    return `[${this.typeNames[0]}]`;
  }
}

/**
 * Helper to create a PSObject from any value
 */
export function wrapToPSObject(val: any, typeName = 'PSCustomObject'): PSObject {
  if (val instanceof PSObject) {
    return val;
  }
  if (typeof val === 'object' && val !== null) {
    return new PSObject(val, typeName);
  }
  const obj = new PSObject({}, typeName);
  obj.setProperty('Value', val);
  return obj;
}
