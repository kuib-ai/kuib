---
name: Vim-native developer workflow
description: User is a vim-native developer who thinks in modal editing, uses fzf-lua for fuzzy finding, visual mode for manipulation, leader-based commands. Wants kuib TUI to have full vim-like navigation (normal/insert/visual modes, j/k navigation, V+J/K for moving, dd for exclude). Has custom nvim config at ~/dotfiles/nvim.
type: user
---

User is deeply invested in vim workflows — modal editing (normal/insert/visual), leader-key commands, fzf fuzzy pickers, visual mode line movement (V+J/K). Does not use flash.nvim — prefers native vim navigation.

Wants kuib TUI to mirror vim grammar: i/I/a/A for edit mode, normal mode for message navigation, V for selection, Shift+J/K for moving messages, dd-style operations for excluding parts. Configurable keybindings are important.

nvim config is at `~/dotfiles/nvim/` — clean modular Lua setup with core/keymap, core/option, core/autocmd, plugin/ structure.
