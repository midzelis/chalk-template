import type { ChalkInstance } from 'chalk';
export interface TemplateNode {
    type: 'template';
    nodes: AstNode[];
    templateString: string;
}
export interface ChalkTemplate {
    type: 'chalktemplate';
    style: Style[];
    body: ChalkTemplateBodyNode[];
}
export interface TextNode {
    type: 'text';
    value: string;
}
export type AstNode = TemplateNode | ChalkTemplate | TextNode;
export type ChalkTemplateBodyNode = ChalkTemplate | TextNode;
export interface TextStyle {
    type: 'textstyle';
    invert: boolean;
    value: string;
}
export interface RgbStyle {
    type: 'rgbstyle';
    invert: boolean;
    rgb?: RGB;
    bgRgb?: RGB;
}
export interface RGB {
    red: number;
    green: number;
    blue: number;
}
export interface HexStyle {
    type: 'hexstyle';
    invert: boolean;
    fghex?: string;
    bghex?: string;
}
export type Style = TextStyle | RgbStyle | HexStyle;
export declare function parse(chalk: ChalkInstance, templateString: string): TemplateNode;
