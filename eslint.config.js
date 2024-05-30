import globals from 'globals';
import pluginJs from '@eslint/js';

export default [
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  {
    rules: {
      // 없으면 기본값 'error', warn, off 설정가능
      'no-unused-vars': 'warn',
    },
  },
];
