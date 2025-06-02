import { app } from "electron";
import type { StructuredToolInterface } from '@langchain/core/tools';
import type { ToolDefinition } from '@shared/types/index.js';


export function isDev(): boolean {
    return !app.isPackaged;
}

/**
 * Flattens nested anyOf structures that can cause problems with some LLM integrations
 * @param schema The JSON schema to flatten
 * @returns A simplified JSON schema
 */
function flattenNestedAnyOf(schema: any): any {
    if (!schema || typeof schema !== 'object') {
        return schema;
    }
    
    // Handle arrays
    if (Array.isArray(schema)) {
        return schema.map(item => flattenNestedAnyOf(item));
    }
    
    // New object to return
    const result: any = { ...schema };
    
    // Handle nested anyOf
    if (schema.anyOf) {
        // If we have a nested anyOf structure that includes types, try to extract a common type
        const types = new Set<string>();
        let hasNullType = false;
        
        // Collect all types from the anyOf entries
        schema.anyOf.forEach((item: any) => {
            // Check for direct type
            if (item.type) {
                types.add(item.type);
            }
            // Check for null
            if (item.type === 'null') {
                hasNullType = true;
            }
            // Check for nested anyOf
            if (item.anyOf) {
                item.anyOf.forEach((nestedItem: any) => {
                    if (nestedItem.type) {
                        types.add(nestedItem.type);
                    }
                    if (nestedItem.type === 'null') {
                        hasNullType = true;
                    }
                });
            }
        });
        
        // Remove null from types
        types.delete('null');
        
        // If we have exactly one type or we have a simple type + null
        if (types.size === 1) {
            const type = Array.from(types)[0];
            result.type = type;
            delete result.anyOf;
            
            // Transfer properties from the anyOf to the main schema
            for (const item of schema.anyOf) {
                if (item.type === type) {
                    // Merge properties and other attributes from this type
                    for (const key in item) {
                        if (key !== 'type' && key !== 'anyOf') {
                            result[key] = item[key];
                        }
                    }
                    break;
                }
            }
        }
    }

    // Fix array item definitions for Google Gemini
    if (result.type === 'array' && result.items) {
        // Ensure items has a proper type field
        if (typeof result.items === 'object') {
            // If items is an object but missing type field, default to string
            if (!result.items.type) {
                console.warn(`[flattenNestedAnyOf] Array items missing 'type' field. Defaulting to 'string'.`);
                result.items.type = 'string';
            }
            
            // Recursively process items
            result.items = flattenNestedAnyOf(result.items);
        } else {
            // If items is not an object, create a proper schema object
            console.warn(`[flattenNestedAnyOf] Items field is not an object. Creating proper schema.`);
            result.items = { type: 'string' };
        }
    }
    
    // Recursively process properties
    if (result.properties) {
        for (const key in result.properties) {
            result.properties[key] = flattenNestedAnyOf(result.properties[key]);
        }
    }
    
    // Process any other nested objects
    for (const key in result) {
        if (typeof result[key] === 'object' && result[key] !== null) {
            result[key] = flattenNestedAnyOf(result[key]);
        }
    }
    
    return result;
}

/**
 * Converts a Langchain StructuredToolInterface into a ToolDefinition suitable for
 * frontend or other consumers, primarily by converting the Zod schema to JSON schema.
 * @param tool The Langchain tool instance.
 * @returns A ToolDefinition object.
 */
export function mapToolToDefinition(tool: StructuredToolInterface): ToolDefinition {
    //console.log(`[mapToolToDefinition] Mapping tool: ${tool.name}`);
    //console.log(`[mapToolToDefinition] Tool schema: ${JSON.stringify(tool.schema, null, 2)}`);
    if (!tool || !tool.schema) {
        console.error(`[mapToolToDefinition] Error: Tool or tool.schema is missing for tool named '${tool?.name}'. Skipping conversion.`);
        return {
            name: tool?.name || 'unknown_tool_error',
            description: 'Error: Tool schema is missing.',
            schema: { 
                type: "object", 
                properties: {}, 
                // required: [] // Optional
            }, 
        };
    }

    // Use type assertion to handle the mismatch with StructuredToolInterface definition.
    const jsonSchema: any = tool.schema as any; 

    // Clean up schema properties that might cause issues
    delete jsonSchema.$schema;

    // Ensure 'properties' exists if schema type is 'object' (tool parameters are always object type)
    // and 'properties' is undefined.
    if ((jsonSchema.type === "object" || typeof jsonSchema.type === 'undefined') && typeof jsonSchema.properties === 'undefined') {
        console.warn(`[mapToolToDefinition] 'properties' field was missing for object schema in tool '${tool.name}'. Defaulting to empty object.`);
        jsonSchema.properties = {};
    }

    // Iterate through properties to clean them up
    if (jsonSchema.properties) {
        for (const propName in jsonSchema.properties) {
            const prop = jsonSchema.properties[propName];
            // Remove "required: false" from individual property definitions as it's non-standard
            if (prop && typeof prop === 'object' && prop.required === false) {
                console.warn(`[mapToolToDefinition] Removing non-standard 'required: false' from property '${propName}' in tool '${tool.name}'.`);
                delete prop.required;
            }
            // Add other property-level cleanup logic here if needed in the future
        }
    }

    // Ensure top-level 'required' is an array if it exists and is not an array
    if (jsonSchema.required && !Array.isArray(jsonSchema.required)) {
        console.warn(`[mapToolToDefinition] Top-level 'required' is not an array for tool '${tool.name}'. Correcting.`);
        // Decide how to handle this: often, if it's not an array, it might be invalid.
        // Setting it to an empty array or deleting it might be options.
        // Let's default to an empty array for now, assuming no properties are required by default in this malformed case.
        jsonSchema.required = [];
    }

    // Flatten complex nested anyOf structures that can cause issues with Google GenAI
    const simplifiedSchema = flattenNestedAnyOf(jsonSchema);

    // Fix all array items for Google Gemini compatibility
    ensureValidArrayItems(simplifiedSchema);

    return {
        name: tool.name,
        description: tool.description,
        schema: simplifiedSchema, // Use the processed and simplified JSON schema
    };
}

/**
 * Recursively ensures that all array items in the schema have valid type definitions
 * to prevent Google Gemini errors about missing fields
 * @param schema The JSON schema to fix
 */
function ensureValidArrayItems(schema: any): void {
    if (!schema || typeof schema !== 'object') {
        return;
    }

    // Process arrays
    if (Array.isArray(schema)) {
        schema.forEach(item => ensureValidArrayItems(item));
        return;
    }

    // Special handling for array type
    if (schema.type === 'array') {
        // If items is missing or not an object, replace with a string type
        if (!schema.items || typeof schema.items !== 'object') {
            schema.items = { type: 'string' };
        } 
        // If items is an object but missing type, add string type
        else if (!schema.items.type) {
            schema.items.type = 'string';
        }
        
        // Recursively process the items schema
        ensureValidArrayItems(schema.items);
    }

    // Process nested properties in objects
    if (schema.properties && typeof schema.properties === 'object') {
        for (const propName in schema.properties) {
            const prop = schema.properties[propName];
            
            // Skip if property is not an object
            if (!prop || typeof prop !== 'object') {
                continue;
            }
            
            // Handle array properties
            if (prop.type === 'array') {
                // If items is missing or not an object, replace with a string type
                if (!prop.items || typeof prop.items !== 'object') {
                    prop.items = { type: 'string' };
                } 
                // If items is an object but missing type, add string type
                else if (!prop.items.type) {
                    prop.items.type = 'string';
                }
            }
            
            // Recursively process the property
            ensureValidArrayItems(prop);
        }
    }

    // Process any other objects
    for (const key in schema) {
        if (schema[key] && typeof schema[key] === 'object') {
            ensureValidArrayItems(schema[key]);
        }
    }
}
