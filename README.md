# JayWorks (Obsidian Plugin Template)

## Design Philosophy

FileView for files
ItemView for SPA (Single Page Application)

内置文档

两层 i18n，一层是应用层字段替换，一层是交互式文档替换。即将考虑支持mdx以便使用React组件而不是笨重的SPA来进行文档呈现。

获取网络资产
1.必要内容文本，README.md 和 Changelog.md
2.资产

## Scripts

### merge-styles

维护一段长长的styles.css十分麻烦，所以我们单独在 ./src/styles/*.css 中根据你喜欢的方式进行分类

### mix-code

现在的SOTA LLM 已经足以容纳大多数插件项目复杂度和代码行数。不久几十万token吗？什么agentic还是rag都不如直接全部喂进去开始讨论。

## Tech Stack

React 19

## Inspiration

Almost perfect community plugin [Taitava/obsidian-shellcommands](github.com/Taitava/obsidian-shellcommands).

An opinionated plugin template [polyipseity/obsidian-plugin-template](github.com/polyipseity/obsidian-plugin-template).

My plugin for guitarist [LIUBINfighter/Obsidian-Tab-Flow](github.com/LIUBINfighter/Obsidian-Tab-Flow).
