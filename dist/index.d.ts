import { type ChalkInstance } from "chalk";
declare function renderer(chalk: ChalkInstance, options?: {
    ["returnAstNode"]: boolean;
}): (...args: any[]) => String;
export declare const chalkTemplateWithChalk: (chalk: ChalkInstance) => (...args: any[]) => String;
export declare const chalkTemplate: (...args: any[]) => String;
export declare const chalkTemplateStderr: (...args: any[]) => String;
/**
 * The AST is EXPERIMENTAL and subject to chance.
 */
export declare const chalkTemplateRenderer: typeof renderer;
export {};
