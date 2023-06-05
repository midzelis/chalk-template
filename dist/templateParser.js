function addKey(object) {
    if (object === undefined)
        return undefined;
    // filter out invert
    const key = JSON.stringify(object, (key, value) => key === 'invert' ? undefined : value);
    const ret = Object.assign(Object.assign({}, object), { key });
    Object.defineProperty(ret, 'key', {
        enumerable: false,
        value: key,
    });
    return ret;
}
export function parse(options = {}, templateString, temp, ...args) {
    const { startTag = '{', endTag = '}' } = options;
    const parts = [];
    parts.push([...temp[0]]);
    for (let index = 1; index < temp.length; index++) {
        parts.push([...args[index - 1]]);
        parts.push([...temp[index]]);
    }
    let part = 0;
    let partpos = 0;
    function savepos() {
        return {
            part,
            partpos,
        };
    }
    function nextChar() {
        adjustPos(1);
        return char();
    }
    function adjustPos(amount) {
        if (partpos + amount < parts[part].length) {
            if (partpos + amount < 0) {
                let a = amount;
                while (a < 0) {
                    if (part === 0) {
                        // wraparound... 
                        part = parts.length - 1;
                    }
                    else {
                        part--;
                    }
                    partpos = parts[part].length;
                    partpos =
                    ;
                }
            }
            else {
                partpos += amount;
            }
        }
        else {
            // advance to next (or subsequent)
        }
        return undefined;
    }
    function char() {
        return parts[part][partpos];
    }
    function remainder() {
        let chars = [];
        chars.push(...parts[part].slice(partpos));
        for (let i = part; i < parts.length; i++) {
            chars.push(...parts[i]);
        }
        return chars.reduce((prev, curr) => prev + curr);
    }
    return parseTemplate();
    function parseTemplate() {
        const nodes = [];
        for (;;) {
            const node = parseNode();
            if (!node)
                break;
            nodes.push(node);
        }
        if (part != parts.length - 1 && partpos != parts[parts.length - 1].length)
            nodes.push({
                type: 'text',
                value: remainder(),
            });
        return {
            type: 'template',
            nodes,
            templateString,
            startTag,
            endTag,
        };
    }
    function parseNode() {
        var _a;
        // directly check for escaped here
        return (_a = parseChalkTemplate()) !== null && _a !== void 0 ? _a : parseText();
    }
    function parseChalkTemplate() {
        const original = savepos();
        let body = [];
        let style;
        if (consume(startTag)) {
            style = parseStyles();
            if (!style)
                return reset(original);
            for (;;) {
                debugger;
                const node = parseNode();
                if (!node)
                    break;
                body.push(node);
            }
            if (!consume(endTag))
                return reset(original);
            return {
                type: 'styletag',
                style,
                children: body,
            };
        }
        return undefined;
    }
    function parseText() {
        const untilStartOrEndTagExclusive = () => {
            let match = '';
            return (char) => {
                const backtrack = match + char;
                if (backtrack.endsWith(startTag))
                    return {
                        kind: 'stop',
                        positionOffset: -(startTag.length - 1),
                    };
                else if (backtrack.endsWith(endTag))
                    return {
                        kind: 'stop',
                        positionOffset: -(endTag.length - 1),
                    };
                match += char;
                return true;
            };
        };
        const value = consumeWhile(untilStartOrEndTagExclusive());
        if (value === false)
            return value;
        return {
            type: 'text',
            value,
        };
    }
    function parseStyles() {
        var _a, _b, _c;
        const original = savepos();
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
            adjustPos(-1);
        }
        if (styles.length === 0)
            return undefined;
        return styles;
    }
    function parseHexStyle(invert) {
        const original = savepos();
        const hash = consume('#');
        if (hash) {
            const fghex = consumeWhile((char) => /[0-9a-fA-F]/.test(char));
            let bghex;
            if (consume(':')) {
                bghex = consumeWhile((char) => /[0-9a-fA-F]/.test(char));
                if (bghex === false)
                    return reset(original);
            }
            else {
                // no seperator, that means there must be a foreground value
                if (fghex === false)
                    return reset(original);
            }
            return addKey({
                type: 'hexstyle',
                invert,
                fghex,
                bghex,
            });
        }
        return undefined;
    }
    function parseRgbStyle(invert, kind) {
        const original = savepos();
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
            return addKey({
                type: 'rgbstyle',
                invert,
                [kind]: {
                    red,
                    green,
                    blue,
                },
            });
        }
        return undefined;
    }
    function parseTextStyle(invert) {
        const original = savepos();
        const style = consumeWhile((char) => /[^\s\\.]/.test(char));
        if (style === false)
            return reset(original);
        return addKey({
            type: 'textstyle',
            invert,
            value: style,
        });
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
        const original = savepos();
        let prev = null;
        for (let j = 0; j < segment.length; j++) {
            const char = nextChar();
            if (char === '\\') {
                if (prev !== '\\') {
                    return reset(original);
                }
            }
            if (char !== segment[j]) {
                return reset(original);
            }
            prev = char;
        }
        return true;
    }
    function consumeWhile(fn) {
        const original = savepos();
        let ret = '';
        let prev = null;
        for (;;) {
            const char = nextChar();
            if (char === '\\') {
                if (prev !== '\\') {
                    prev = char;
                    continue;
                }
            }
            const action = prev === '\\' || fn(char);
            if (action === true)
                ret += char;
            else if (action === false)
                break;
            else if (action.kind === 'stop') {
                ret = ret.slice(0, action.positionOffset);
                adjustPos(action.positionOffset);
                break;
            }
            prev = char;
        }
        if (partpos != original.partpos && part != original.part) {
            return ret;
        }
        return reset(original);
    }
    function reset(index) {
        partpos = index.partpos;
        part = index.part;
        return false;
    }
    function consumeNumber() {
        return consumeWhile(isDigit);
    }
    function consumeWhitespace() {
        consumeWhile(isWhitespace);
    }
    function isWhitespace(char) {
        // prettier-ignore
        return char === ' '
            || char === '\n'
            || char === '\t'
            || char === '\r'
            || char === '\f'
            || char === '\v'
            || char === '\u00a0'
            || char === '\u1680'
            || char === '\u2000'
            || char === '\u200a'
            || char === '\u2028'
            || char === '\u2029'
            || char === '\u202f'
            || char === '\u205f'
            || char === '\u3000'
            || char === '\ufeff';
    }
    function isDigit(char) {
        return char >= '0' && char <= '9';
    }
}
