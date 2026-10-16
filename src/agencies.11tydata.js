export default {
  eleventyComputed: {
    pageNavigation: ({ localizedAgency }) =>
      ['research', 'partnership', 'process', 'contact'].map((key) => ({
        label: localizedAgency.content.nav[key],
        href: `#${localizedAgency.anchors[key]}`
      }))
  }
};
