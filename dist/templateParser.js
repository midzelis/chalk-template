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
    debugger;
    const parts = [];
    parts.push([...temp[0]]);
    for (let index = 1; index < temp.length; index++) {
        parts.push([...args[index - 1]]);
        parts.push([...temp[index]]);
    }
    let part = 0;
    let partpos = 0;
    let styleStack = [];
    let cachedChar;
    function saveState() {
        return {
            part,
            partpos,
            styleStack: [...styleStack],
        };
    }
    function isEscaped() {
        if (cachedChar === undefined) {
            cachedChar = prevChar();
        }
        return cachedChar === '\\';
    }
    function charAdvance() {
        let c = char();
        if (c === '\\' && !isEscaped()) {
            adjustPos(1);
            const newPrev = c;
            c = char();
            adjustPos(1);
            cachedChar = newPrev;
            return c;
        }
        adjustPos(1);
        return (cachedChar = c);
    }
    function adjustPos(amount) {
        let remainder = amount;
        if (amount < 0 && cachedChar == '\\') {
            remainder--;
        }
        cachedChar = undefined;
        while (remainder != 0) {
            if (partpos + remainder < parts[part].length &&
                partpos + remainder >= 0) {
                partpos += remainder;
                remainder = 0;
            }
            else if (partpos + remainder < 0) {
                if (part === 0) {
                    partpos += remainder;
                    return;
                }
                remainder += partpos + 1;
                part--;
                partpos = parts[part].length - 1;
            }
            else if (partpos + remainder > parts[part].length - 1) {
                if (part === parts.length - 1) {
                    partpos += remainder;
                    return;
                }
                remainder = remainder - 1 - (parts[part].length - 1 - partpos);
                part++;
                partpos = 0;
            }
        }
        return;
    }
    function char() {
        var _a;
        return (_a = parts[part]) === null || _a === void 0 ? void 0 : _a[partpos];
    }
    function prevChar() {
        var _a;
        const saved = { part, partpos };
        adjustPos(-1);
        const c = (_a = parts[part]) === null || _a === void 0 ? void 0 : _a[partpos];
        part = saved.part;
        partpos = saved.partpos;
        return c;
    }
    function remainder() {
        if (part < 0 ||
            part > parts.length - 1 ||
            partpos < 0 ||
            partpos > parts[part].length - 1)
            return;
        let chars = [];
        chars.push(...parts[part].slice(partpos));
        for (let i = part + 1; i < parts.length; i++) {
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
        const value = remainder();
        if (value) {
            nodes.push({
                type: 'text',
                value,
            });
        }
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
    function isOdd(x) {
        return !!(x & 1);
    }
    function parseChalkTemplate() {
        debugger;
        // this is an escaped arg
        if (isOdd(part) && !styleStack[styleStack.length - 1])
            return;
        const original = saveState();
        let body = [];
        let style;
        if (consumeStartTag()) {
            style = parseStyles();
            if (!style)
                return reset(original);
            if (style.length === 1 &&
                style[0].type === 'textstyle' &&
                style[0].value === 'style') {
                if (isOdd(part) && partpos === 0) {
                    // for style to apply, we must be at the start of an arg
                    styleStack.push(true);
                }
            }
            for (;;) {
                const node = parseNode();
                if (!node)
                    break;
                body.push(node);
            }
            if (!consumeEndTag())
                return reset(original);
            styleStack = original.styleStack;
            return {
                type: 'styletag',
                style,
                children: body,
            };
        }
        return;
    }
    function consumeStartTag() {
        debugger;
        const original = saveState();
        const consumed = consume(startTag);
        if (consumed && isEscaped())
            return reset(original);
        return consumed;
    }
    function consumeEndTag() {
        const original = saveState();
        const consumed = consume(endTag);
        if (consumed && isEscaped())
            return reset(original);
        return consumed;
    }
    function parseText() {
        if (isOdd(part) && !styleStack[styleStack.length - 1]) {
            const value = parts[part]
                .slice(partpos, parts[part].length)
                .reduce((a, b) => a + b);
            adjustPos(value.length);
            return {
                type: 'text',
                value,
            };
        }
        const untilStartOrEndTagExclusive = () => {
            let characters = '';
            let originalpart = part;
            return (char) => {
                const backtrack = characters.endsWith('\\')
                    ? characters
                    : characters + char;
                if (backtrack.endsWith(startTag))
                    return {
                        accept: false,
                        positionOffset: -startTag.length,
                    };
                else if (backtrack.endsWith(endTag))
                    return {
                        accept: false,
                        positionOffset: -endTag.length,
                    };
                if (part != originalpart)
                    return {
                        accept: true,
                        positionOffset: 0,
                    };
                characters += char;
                return true;
            };
        };
        const value = consumeWhile(untilStartOrEndTagExclusive());
        if (value === undefined)
            return;
        return {
            type: 'text',
            value,
        };
    }
    function parseStyles() {
        var _a, _b, _c;
        const original = saveState();
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
        if (styles.length === 0)
            return;
        // There must be whitespace following the style, to delineate end of style
        // If the whitespace is ' ', then it is swallowed, otherwise it is preserved
        const nextSpace = consumeNextWhitespace();
        if (!nextSpace)
            return reset(original);
        if (nextSpace !== ' ') {
            adjustPos(-1);
        }
        if (styles.length === 0)
            return;
        return styles;
    }
    function parseHexStyle(invert) {
        const original = saveState();
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
            return addKey({
                type: 'hexstyle',
                invert,
                fghex,
                bghex,
            });
        }
        return;
    }
    function parseRgbStyle(invert, kind) {
        const original = saveState();
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
        return;
    }
    function parseTextStyle(invert) {
        const original = saveState();
        const style = consumeWhile((char) => /[^\s\\.]/.test(char));
        if (!style)
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
                return isWhitespace(char);
            };
        };
        return consumeWhile(nextWhiteSpace());
    }
    function consume(segment) {
        const original = saveState();
        for (let j = 0; j < segment.length; j++) {
            const char = charAdvance();
            if (char !== segment[j])
                return reset(original);
        }
        return true;
    }
    function consumeWhile(fn) {
        const original = saveState();
        let ret = '';
        for (;;) {
            const char = charAdvance();
            if (char === undefined) {
                adjustPos(-1);
                break;
            }
            const action = fn(char);
            if (action === true) {
                ret += char;
            }
            else if (action === false) {
                adjustPos(-1);
                break;
            }
            else {
                const { accept, positionOffset } = action;
                if (accept)
                    ret += char;
                adjustPos(positionOffset);
                break;
            }
        }
        if (partpos != original.partpos || part != original.part) {
            return ret;
        }
        return;
    }
    function reset(index) {
        partpos = index.partpos;
        part = index.part;
        styleStack = index.styleStack;
        return;
    }
    function consumeNumber() {
        return consumeWhile(isDigit);
    }
    function consumeWhitespace() {
        return consumeWhile(isWhitespace);
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
