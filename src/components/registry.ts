import SimpleButton from './SimpleButton';
import OcrPlayground from './OcrPlayground';
import CodeBlock from './CodeBlock';

// Central component whitelist for MDX rendering.
export function getComponentMap() {
  return {
    // Provide both original PascalCase and lowercase aliases.
    SimpleButton,
    simplebutton: SimpleButton,
    OcrPlayground,
    ocrplayground: OcrPlayground,
    CodeBlock,
    codeblock: CodeBlock,
  } as const;
}

export type ComponentMap = ReturnType<typeof getComponentMap>;
