import { Chalk, chalkStderr, type ChalkInstance } from 'chalk';
import { drawer, type DrawOptions } from './drawer.js';

const compatDefaults = {
	compat: true,
	strict: true,
};

export function makeTemplate(chalk: ChalkInstance, opts?: DrawOptions) {
	return drawer(chalk, { ...compatDefaults, ...opts });
}
export function makeTaggedTemplate(chalk: ChalkInstance, opts?: DrawOptions) {
	return drawer(chalk, { ...compatDefaults, ...opts });
}

export const template = makeTemplate(new Chalk());
export const chalkTemplate = makeTaggedTemplate(new Chalk());

export const templateStderr = makeTemplate(chalkStderr);
export const chalkTemplateStderr = makeTaggedTemplate(chalkStderr);
