export interface Template {
    type: 'template';
    nodes: AstNode[];
    templateString: string;
    startTag: string;
    endTag: string;
}
export interface StyleTag {
    type: 'styletag';
    style: Style[];
    children: StyleTagChild[];
}
export interface EscapedStyleTag {
    type: 'escapedstyletag';
    value: string;
}
export interface Text {
    type: 'text';
    value: string;
}
export type AstNode = Template | StyleTag | EscapedStyleTag | Text;
export type StyleTagChild = StyleTag | EscapedStyleTag | Text;
export interface Keyed {
    key: string;
}
export interface TextStyle extends Keyed {
    type: 'textstyle';
    invert: boolean;
    value: string;
}
export interface RgbStyle extends Keyed {
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
export interface HexStyle extends Keyed {
    type: 'hexstyle';
    invert: boolean;
    fghex: string | false;
    bghex: string | false;
}
export type Style = TextStyle | RgbStyle | HexStyle;
type Options = {
    startTag?: string;
    endTag?: string;
};
export declare function parse(options: Options, templateString: string, temp: string[], ...args: any[]): Template;
export {};
