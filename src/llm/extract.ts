// Pull the first JSON object out of a model's text response. Providers ask for
// pure JSON, but some wrap it in prose or code fences; grabbing the outermost
// braces tolerates that. Throws if no object is present.
export function extractJson(text: string): any {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) throw new Error('no json in response');
  return JSON.parse(text.slice(start, end + 1));
}
