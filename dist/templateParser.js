const startTemplate = '{';
const endTemplate = '}';
export function parse(chalk, templateString) {
    let position = 0;
    return parseTemplate();
    function parseTemplate() {
        const nodes = [];
        for (;;) {
            const node = parseNode();
            if (!node)
                break;
            nodes.push(node);
        }
        return {
            type: 'template',
            nodes,
            templateString,
        };
    }
    function parseNode() {
        var _a;
        return (_a = parseChalkTemplate()) !== null && _a !== void 0 ? _a : parseText();
    }
    function parseChalkTemplate() {
        const original = position;
        let body = [];
        let style;
        if (consume(startTemplate)) {
            style = parseStyles();
            if (!style)
                return reset(original);
            for (;;) {
                const node = parseNode();
                if (!node)
                    break;
                body.push(node);
            }
            if (!consume(endTemplate))
                return reset(original);
            return {
                type: 'chalktemplate',
                style,
                body,
            };
        }
        return undefined;
    }
    function parseText() {
        const textmatcher = () => {
            let match = '';
            return (char) => {
                const matchesStart = () => (match + char).endsWith(startTemplate);
                const matchesEnd = () => (match + char).endsWith(endTemplate);
                if (matchesStart() || matchesEnd())
                    return {
                        kind: 'reject',
                        amount: startTemplate.length - 1,
                    };
                match += char;
                return true;
            };
        };
        const value = consumeWhile(textmatcher());
        if (value === undefined)
            return undefined;
        return {
            type: 'text',
            value,
        };
    }
    function parseStyles() {
        var _a, _b, _c;
        const original = position;
        const styles = [];
        for (;;) {
            const invert = consume('~');
            const style = (_c = (_b = (_a = parseHexStyle(invert)) !== null && _a !== void 0 ? _a : parseRgbStyle(invert, 'rgb')) !== null && _b !== void 0 ? _b : parseRgbStyle(invert, 'bgRgb')) !== null && _c !== void 0 ? _c : parseTextStyle(invert);
            if (!style)
                break;
            styles.push(style);
            if (!consume('.'))
                break;
        }
        // There must be whitespace following the style, to delineate end of style
        // If the whitespace is ' ', then it is swallowed, otherwise it is preserved
        const nextSpace = consumeNextWhitespace();
        if (!nextSpace)
            return reset(original);
        if (nextSpace !== ' ') {
            position--;
        }
        if (styles.length === 0)
            return undefined;
        return styles;
    }
    function parseHexStyle(invert) {
        const original = position;
        const hash = consume('#');
        if (hash) {
            const fghex = consumeWhile((char) => /[0-9a-fA-F]/.test(char));
            let bghex;
            if (consume(':')) {
                bghex = consumeWhile((char) => /[0-9a-fA-F]/.test(char));
                if (!bghex)
                    return reset(original);
            }
            else {
                // no seperator, that means there must be a foreground value
                if (!fghex)
                    return reset(original);
            }
            return {
                type: 'hexstyle',
                invert,
                fghex,
                bghex,
            };
        }
        return undefined;
    }
    function parseRgbStyle(invert, kind) {
        const original = position;
        const rgb = consume(kind);
        if (rgb) {
            consumeWhitespace();
            const lparen = consume('(');
            if (!lparen)
                reset(original);
            consumeWhitespace();
            const red = consumeNumber();
            if (!red)
                reset(original);
            consumeWhitespace();
            consume(',');
            consumeWhitespace();
            const green = consumeNumber();
            if (!green)
                reset(original);
            consumeWhitespace();
            consume(',');
            consumeWhitespace();
            const blue = consumeNumber();
            if (!blue)
                reset(original);
            consumeWhitespace();
            const rparen = consume(')');
            if (!rparen)
                reset(original);
            return {
                type: 'rgbstyle',
                invert,
                [kind]: {
                    red,
                    green,
                    blue,
                },
            };
        }
        return undefined;
    }
    function parseTextStyle(invert) {
        const original = position;
        const style = consumeWhile((char) => /[^\s\\.]/.test(char));
        if (!style)
            return reset(original);
        if (!chalk[style])
            return reset(original);
        return {
            type: 'textstyle',
            invert,
            value: style,
        };
    }
    function consumeNextWhitespace() {
        const nextWhiteSpace = () => {
            let limit = 1;
            return (char) => {
                if (limit === 0)
                    return false;
                limit--;
                return /\s/.test(char);
            };
        };
        return consumeWhile(nextWhiteSpace());
    }
    function consume(segment) {
        for (let j = 0; j < segment.length; j++) {
            if (templateString[position + j] !== segment[j]) {
                return undefined;
            }
        }
        position += segment.length;
        return true;
    }
    function consumeWhile(fn) {
        let newIndex = position;
        let adjust = 0;
        while (templateString[newIndex] != null) {
            const action = fn(templateString[newIndex]);
            if (action === true)
                newIndex++;
            else if (action === false)
                break;
            else if (action.kind === 'reject') {
                adjust = -action.amount;
                break;
            }
        }
        if (newIndex > position) {
            const result = templateString.substring(position, newIndex + adjust);
            position = newIndex + adjust;
            return result;
        }
        return undefined;
    }
    function reset(index) {
        position = index;
        return undefined;
    }
    function consumeNumber() {
        return consumeWhile((char) => /\d/.test(char));
    }
    function consumeWhitespace() {
        consumeWhile((char) => /\s/.test(char));
    }
}
