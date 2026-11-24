module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/img");

  return {
    dir: {
      input: "src",
      output: "_site",
    },
    // PATH_PREFIX must look like "/repository-name/" in CI
    pathPrefix: process.env.PATH_PREFIX || "/",
    markdownTemplateEngine: "njk",
  };
};
