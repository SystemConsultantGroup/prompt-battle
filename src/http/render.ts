import { randomBytes } from 'node:crypto';
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

export class GenStore {
  private map = new Map<string, GeneratedCode>();
  private roomTokens = new Map<string, Set<string>>();
  put(code: GeneratedCode, roomCode?: string): string {
    const token = randomBytes(16).toString('hex');
    this.map.set(token, code);
    if (roomCode !== undefined) {
      let tokens = this.roomTokens.get(roomCode);
      if (!tokens) {
        tokens = new Set();
        this.roomTokens.set(roomCode, tokens);
      }
      tokens.add(token);
    }
    return token;
  }
  get(token: string): GeneratedCode | undefined { return this.map.get(token); }
  clearRoom(roomCode: string) {
    const tokens = this.roomTokens.get(roomCode);
    if (!tokens) return;
    for (const token of tokens) this.map.delete(token);
    this.roomTokens.delete(roomCode);
  }
  clear() {
    this.map.clear();
    this.roomTokens.clear();
  }
}
