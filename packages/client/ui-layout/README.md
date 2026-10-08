---
description: "Simin workbench navigation, document reading, existing conversation slots, detail panels, and theme presentation."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-layout

English | [中文](README.zh.md)

## Summary

This package provides Simin's personal workbench over real project files and the existing conversation. AppFrame owns viewport measurement, shell overlays, and the floating Agent detail panel; SiminShell owns navigation and reading. The theme presenter projects palette, content font size, and document metadata.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Home lays out actual project folders in four columns on wide windows and fewer columns on smaller windows, with zero to three paper previews according to the real document count. Transparent backs span the folder width. Papers stay inside the folder; the front paper keeps the project name visible above a bounded document preview. Empty folders show the project name on the pocket without a paper. The greeting uses heavier text and a decorative wave emoji. Project navigation restores the main conversation through the workspace owner. Documents, full-text search, templates, trash, and settings use local Host data. Templates add a draft without sending or creating files.

Reading and conversation share the project view on wide windows; narrower windows switch between them. Save proposals display content or line differences before confirmation. File mutations carry the observed content version; conflicts retain the current document. Navigation and display preferences use localStorage; document bodies remain on disk.

The project sidebar has one primary New document action for the current project. Only project headers show a breadcrumb; global pages omit it. Project headers retain search and focus controls; New project actions remain on global pages. Conversation mode has no extra workbench title bar; the sidebar's document entries return to reading.

Workbench navigation and template entries use a selected set of [Heroicons v2.2.0 solid icons](https://github.com/tailwindlabs/heroicons/tree/v2.2.0/optimized/24/solid); their MIT license is retained in [SiminIcons](src/client/SiminIcons.tsx). Templates appear as flat rows with thin dividers, monochrome icons, and the shared rounded action style. Each preview dialog names its selected starting point.

Workbench settings use flat groups with hairline dividers and monochrome shared switches. Local preferences save immediately; directory copying and the existing model settings dialog remain available through compact row actions.

The root keeps the `main`, `rightbar`, `shell.bottom`, and `shell.overlay` slots. The hidden legacy sidebar keeps its settings portal mounted. Global-panel selection and the existing conversation continue to use `ctx.layout`; the workbench supplies the visible navigation.

<a id="window-chrome-seat"></a>
### Window-chrome seat

Simin's macOS rail places its brand below the traffic lights with 48px top padding. The header marks draggable space with `data-window-drag`; controls remain clickable. The root overlay clearance variables retain the platform titlebar and native-fullscreen behavior. `shell.leading` remains registered for compatibility but is not rendered by this frame.

### Theme presentation

The presenter consumes resolved theme snapshots and projects them onto the document: `html { color-scheme }` for native UA chrome, `body[data-ds-dark-theme]` from the active color scheme, the theme's alias tokens and `--dsh-content-font-size` as inline variables on body, and one owned `<meta name="theme-color">` whose content follows the computed body background. Disposing the presenter removes its metadata node with its other global writes.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

`selectPanel(id)` validates the live `main` registry. `beginNavigation()` aborts superseded navigation without cancelling underlying Session creation. The root store separates panel selection from viewport and detail-panel measurements. AppFrame measures its own box with ResizeObserver and a cancellable animation frame, and releases both on unmount.

Project opening, draft insertion, conversation search, and model settings use DOM events handled by their existing owners. ui-layout does not value-import ui-workspace. The workbench polls local project data every two seconds with abortable requests; it retains content when reads fail. Existing Agent detail panels render in the floating rightbar slot, which is unavailable below 640px. The independent title component projects the active Session title. Theme updates remain event-driven pure DOM writes.

Project reading and conversation share the theme's base surface and use thin separators between navigation, panes, and headers. The split conversation uses its existing Session header; a separate workbench chat toolbar appears only in the chat-only view.

<a id="further-exploration"></a>
## Further Exploration

Read these pages when the layout surface is not enough. They move from the frame to the columns it renders and the theme it presents.

- [ui-sidebar](../ui-sidebar/README.md) — occupies the `sidebar` column and its seats.
- [ui-conversation](../ui-conversation/README.md) — occupies the `main` key `conversation`.
- [ui-sidebar-right](../ui-sidebar-right/README.md) — occupies the `rightbar` column with one docking surface per session.
- [ui-theme](../ui-theme/README.md) — the theme seam whose resolved snapshots the presenter consumes.
- [Web client architecture](../../../docs/subsystems/web-client.md) — how browser plugin rows load and register slots.

-----

<a id="model-experience"></a>
## Model Experience

None, as the layout shell manages browser viewing state; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- Project navigation is personal and local; the filesystem root belongs to the Host configuration in this checkout.
- File refresh uses polling; external edits may take up to one polling interval to appear.
- The workbench does not connect Figma, GitHub, or Feishu, and does not prescribe project stages.
- Windows layout and public distribution are outside this personal Mac build's qualification.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
