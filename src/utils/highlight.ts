let markLib: any | null = null;

async function ensureMark() {
  if (markLib) return markLib;
  // @ts-ignore
  markLib = (await import('mark.js')).default;
  return markLib;
}

export async function highlightTerms(root: HTMLElement, terms: string[]) {
  if (!terms.length) return;
  const Mark = await ensureMark();
  const instance = new Mark(root);
  await new Promise<void>(resolve => instance.unmark({ done: () => resolve() }));
  instance.mark(terms, { separateWordSearch: false, className: 'jw-search-hit' });
}

export async function clearHighlights(root: HTMLElement) {
  const Mark = await ensureMark();
  const instance = new Mark(root);
  await new Promise<void>(resolve => instance.unmark({ done: () => resolve() }));
}
