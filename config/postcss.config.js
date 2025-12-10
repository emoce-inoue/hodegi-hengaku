module.exports = {
  plugins: [require('postcss-import'), require('postcss-nested'), require('postcss-mixins'), require('cssnano')({ preset: 'default' })],
};
