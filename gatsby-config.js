module.exports = {
  siteMetadata: {
    description:
      "Ashkan Yousefi Zadeh is a PhD Candidate at QUT researching human-centred explainable AI for automated vehicles.",
    formspreeEndpoint: "",
    locale: "en",
    showThemeLogo: false,
    title: "Ashkan Yousefi Zadeh",
  },
  plugins: [
    {
      resolve: "@wkocjan/gatsby-theme-intro",
      options: {
        basePath: "/",
        contentPath: "content/",
        showThemeLogo: false,
        theme: "classic",
      },
    },
  ],
}
