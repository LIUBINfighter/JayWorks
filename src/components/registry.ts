import SimpleButton from './SimpleButton';
import OcrPlayground from './OcrPlayground';

// Central component whitelist for MDX rendering.
export function getComponentMap() {
  return {
    // Provide both original PascalCase and lowercase aliases.
    SimpleButton,
    simplebutton: SimpleButton,
    OcrPlayground,
    ocrplayground: OcrPlayground,
  } as const;
}

export type ComponentMap = ReturnType<typeof getComponentMap>;
