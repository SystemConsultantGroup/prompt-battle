import type { GeneratedCode } from '../game/types.ts';

export function renderDoc(code: GeneratedCode): string {
  const js = code.js.replace(/<\/script>/gi, '<\\/script>');
  return `<!doctype html>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:;">
<style>${code.css}</style>
<body>${code.html}<script>${js}</script>
</body>`;
}

let counter = 0;
export class GenStore {
  private map = new Map<string, GeneratedCode>();
  put(code: GeneratedCode): string {
    const token = `g${(counter++).toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
    this.map.set(token, code);
    return token;
  }
  get(token: string): GeneratedCode | undefined { return this.map.get(token); }
  clear() { this.map.clear(); }
}
