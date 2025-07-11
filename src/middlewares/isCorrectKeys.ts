import { Model, ModelStatic } from "sequelize";

export function hasOnlyKeysOfB(obj: object, model: ModelStatic<Model>): boolean {
    
    const modelKeys = Object.keys(model.getAttributes())

    const allowed = new Set(modelKeys);
    return Object.keys(obj).every(key => allowed.has(key) || key == "subtasks");
}