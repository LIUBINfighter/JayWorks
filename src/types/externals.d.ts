// 临时宽松声明缺失的第三方模块，避免阻塞开发。
declare module 'dompurify' { const x: any; export = x; }
declare module 'd3' { const x: any; export = x; }
declare module 'vfile' { const x: any; export = x; }
declare module 'rehype-react' { const x: any; export = x; }

// JSX namespace fallback
declare namespace JSX { interface Element { [k: string]: any } interface IntrinsicElements { [k: string]: any } }
