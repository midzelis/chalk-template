import { Chalk, chalkStderr } from "chalk";
import { parse } from "./templateParser.js";
import { renderChalk } from "./templateRenderer.js";
function renderer(chalk, options) {
    function renderTaggedTemplate(pieces, ...args) {
        let msg;
        const lastIdx = pieces.length - 1;
        if (Array.isArray(pieces) &&
            pieces.every(isString) &&
            lastIdx === args.length) {
            msg =
                args.map((a, i) => pieces[i] + stringify(a)).join("") + pieces[lastIdx];
        }
        else {
            msg = [pieces, ...args.map(stringify)].join(" ");
        }
        const ast = parse(chalk, msg);
        const rendered = renderChalk(chalk, ast);
        if (options && options.returnAstNode) {
            return { rendered, ast };
        }
        return rendered;
    }
    return renderTaggedTemplate;
}
function stringify(arg) {
    return `${arg}`;
}
function isString(obj) {
    return typeof obj === "string";
}
export const chalkTemplateWithChalk = (chalk) => renderer(chalk);
export const chalkTemplate = renderer(new Chalk());
export const chalkTemplateStderr = renderer(chalkStderr);
/**
 * The AST is EXPERIMENTAL and subject to chance.
 */
export const chalkTemplateRenderer = renderer;
