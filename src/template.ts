import { Chalk, chalkStderr, type ChalkInstance } from 'chalk';
import { drawer, type DrawOptions } from './drawer.js';

const opts = {
	compat: true,
	strict: true,
};

export function makeTemplate (chalk: ChalkInstance, opts: DrawOptions) {
    return drawer(chalk, opts);
}
export function makeTaggedTemplate (chalk: ChalkInstance, opts: DrawOptions) {
    return drawer(chalk, opts);
}

export const template = makeTemplate(new Chalk(), opts);
export const chalkTemplate = makeTaggedTemplate(new Chalk(), opts);

export const templateStderr = makeTemplate(chalkStderr, opts);
export const chalkTemplateStderr = makeTaggedTemplate(chalkStderr, opts);
