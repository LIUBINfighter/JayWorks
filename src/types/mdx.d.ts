declare module '*.mdx' {
  // 兼容两种构建方式：作为纯文本 (esbuild text loader) 或经 MDX 编译为 React 组件
  const MDXModule: string | ((props: { [key: string]: any }) => any);
  export default MDXModule;
}
