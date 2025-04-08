import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    '.json-autotranslate-cache/**',
    'src/locales/**',
    'src/scripts/**',
  ],
  rules: {
    'no-console': 'off',
    'unused-imports/no-unused-vars': 'warn',
  },
})
