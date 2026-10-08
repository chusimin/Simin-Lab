---
kind: upgrade-guide
description: Simin 文件操作现在需要携带已读文档的内容版本。
---

# Simin 文档版本

[English](guide.md) | 中文

## 变更

本机 `/aipm/stage` 接口不再允许缺少已读内容版本的覆盖写入。版本缺失或过期时返回 HTTP 409。Simin 客户端通过预览确认和带版本的 `/aipm/mutate` 请求保存。项目文件保留在当前工作区的 `projects/` 目录下。

## 迁移

1. 通过 `/aipm/file?project=<name>&file=<name>` 读取文档并保留 `version`。新文档使用 `version: null`。
2. 保存审阅后的内容时带上该版本。HTTP 409 后重新读取当前正文，审阅后再重试。
3. 确认文件出现在项目目录，并验证过期版本会被拒绝。已有会话文件无需迁移。
