import type { GeneratedCode } from '../game/types.ts';

function neutralizeClosers(s: string): string {
  // Break the tag-name so the HTML tokenizer can't recognize an end tag,
  // covering </script>, </script >, </script/>, </script\n, and the same for style.
  return s.replace(/<\/(script|style)/gi, '<\\/$1');
}

export function renderDoc(code: GeneratedCode): string {
  const js = neutralizeClosers(code.js);
  const css = neutralizeClosers(code.css);
  return `<!doctype html>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:;">
<style>${css}</style>
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
