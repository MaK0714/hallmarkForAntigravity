export const pluginHookCommand = 'node skills/hallmark/scripts/lint-hook.mjs';
export const editToolMatcher = 'write_to_file|replace_file_content|multi_replace_file_content|write_file|edit_file';

export function hallmarkHooks(command) {
  return {
    'hallmark-linter': {
      PostToolUse: [{
        matcher: editToolMatcher,
        hooks: [{ type: 'command', command, timeout: 15 }],
      }],
    },
  };
}
