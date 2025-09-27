# JayWorks (Obsidian Plugin Template)

## Design Philosophy

FileView for files
ItemView for SPA (Single Page Application)

### DevOps

#### Tag & Release & Changelog

#### CI & Code Security

Avoid innerHTML and blablabla...

### Data Persistence

loadData()
saveData()
这两个方法足以解决大部分问题，不要使用localstorige/indexedDB一类无法被管理的技术

暂时不需要持久化视图状态到工作区。

### Built-in doc

80%的常用功能不应该离开工作区进行学习和操作，与其打开在线文档进行复杂的加载以及独立维护一个文档网站Repo的开销，不如做成内置的doc

内置文档

两层 i18n，一层是应用层字段替换，一层是交互式文档替换。即将考虑支持mdx以便使用React组件而不是笨重的SPA来进行文档呈现。

i18n是标配无需多言，版本化文档其实只有大版本更新才会有，也就相当于长期维护也就预期2-4版文档，不超过5版（能进化到v4.0.0那都是很后面的开发了），每个版本在其 0.x.y 的 x.y版本中都只会指向当前的最新版Release，最多多一个Beta/next版本，你明白吗？

也就是可能最终都只会有

```md
0.12.9 (正式版前最后一个版本)
1.8.2 （正式v1版最后一个版本）
2.5.3 (v2版最后一个版本)
3.2.1 （当前v3版最新）
3.2.x-beta （当前v3版开发/测试）
```

这种类似的形式。

### 获取网络资产

0. 初次设置提示
1. 在SettingTab中提供配置管理资产的页签
2. 必要内容文本，README.md 和 Changelog.md
3. 资产通过github release打包

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

My tiny plugin for guitarist [LIUBINfighter/Obsidian-Tab-Flow](github.com/LIUBINfighter/Obsidian-Tab-Flow).
