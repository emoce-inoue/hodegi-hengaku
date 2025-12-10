module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    'color-no-invalid-hex': true,
    'block-no-empty': true,
    'selector-pseudo-class-no-unknown': true,
    'selector-type-no-unknown': true,
    'property-no-unknown': true,
    'value-keyword-case': 'lower',
    'declaration-no-important': true,
    'shorthand-property-no-redundant-values': true,
    'length-zero-no-unit': true,
    'at-rule-no-unknown': true,
    'selector-max-id': 0,
    'media-feature-name-no-unknown': true,
    'selector-class-pattern': null,
    'media-feature-range-notation': 'prefix',
  },
};
