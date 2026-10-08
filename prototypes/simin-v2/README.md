# Simin interactive prototype

English | [中文](README.zh.md)

## Summary

This standalone design prototype demonstrates the workbench with browser-local sample projects, documents, conversations, trash, and preferences. It does not connect to an Agent or read real project files. See the [platform README](../../README.md) for the desktop application.

## Open and explore

Open the repository-root `Simin工作台-完整原型.html` directly. It embeds its scripts and styles without external assets. The maintained sources are `index.html`, `style.css`, and `app.js` in this directory; [DESIGN.md](DESIGN.md) records the visual direction.

Use the page guide at the top right to explore states, or start the guided core flow. The demo persists in browser localStorage under `simin.prototype.v2`.

| Entry | Demonstrated interaction |
|---|---|
| Home | Create a project, switch grid/list, resume progress |
| Project | Discuss, stop, retry, and review proposed content |
| Documents | Read, view source, copy, quote, and focus |
| Save review | Confirm or cancel a creation or edit |
| Search | Find projects, documents, and sample conversations |
| Discussion starters | Preview a prompt and carry it into a draft |
| Trash | Restore files or confirm permanent deletion |
| Settings | Change send behavior, remembered progress, and motion |

All assistant replies are deterministic demo responses. Editing and saving affect the prototype’s browser data only.

## Keyboard and windows

Cmd/Ctrl+K opens search. Arrow keys select a result; Enter opens it. Escape closes dialogs or exits focused reading. Enter sends and Shift+Enter inserts a newline by default; Settings can switch sending to Cmd/Ctrl+Enter. Narrow windows offer navigation and document/conversation switching.

The prototype uses a monochrome palette with small color accents, translucent folder entries, and black primary actions. Desktop implementation evolves independently of this design reference.
