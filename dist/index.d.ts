import { type ChalkInstance } from 'chalk';
declare function renderer(chalk: ChalkInstance, options?: {
    returnAstNode?: boolean;
    startTag?: string;
    endTag?: string;
}): (...args: any[]) => string;
export declare const chalkTemplateWithChalk: (chalk: ChalkInstance) => (...args: any[]) => string;
export declare const chalkTemplate: (...args: any[]) => string;
export declare const chalkTemplateStderr: (...args: any[]) => string;
/**
 * The AST is EXPERIMENTAL and subject to chance.
 */
export declare const chalkTemplateRenderer: typeof renderer;
export {};
