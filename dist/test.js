const a = "\\👉🏿";
console.log(a);
let b = "";
for (let i = 0; i < a.length; i++) {
    console.log(a.charAt(i));
    b += a.charAt(i);
}
console.log('b', b);
const d = [];
console.log('ext');
const c = a.split("");
for (let i = 0; i < c.length; i++) {
    console.log(c[i]);
    d.push(c[i]);
}
console.log('d', d);
console.log(String.fromCharCode(...d));
// console.log(String.fromCodePoint(...d));
console.log(String(...d));
console.log('aa');
const f = [];
const e = [...a];
let g = '';
for (let i = 0; i < e.length; i++) {
    console.log(e[i]);
    f.push(e[i]);
    g += e[i];
}
console.log('f', f);
console.log(String.fromCharCode(...f));
// console.log(String.fromCodePoint(...f));
console.log(String(...f));
console.log(f.join());
console.log(g);
console.log(f.reduce((prev, curr) => prev + curr));
export {};
