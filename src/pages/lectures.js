import { graphql } from "gatsby"
import React from "react"
import PageShell from "../components/page-shell"
import YouTubeVideo from "../components/youtube-video"

const LecturesPage = ({ data }) => (
  <PageShell profile={data.profile} social={data.social.nodes} title="Lectures">
    <p className="font-text text-sm leading-normal mb-8">
      A sample of my lectures and tutoring.
    </p>
    <section className="bg-back-light border-t-4 border-line p-4 lg:p-8">
      <h2 className="font-header font-bold text-2xl text-front mb-4">
        Sample Lecture
      </h2>
      <YouTubeVideo videoId="c3le1rQ9Gxs" title="Sample lecture by Ashkan Yousefi Zadeh" />
    </section>
  </PageShell>
)

export default LecturesPage

export const query = graphql`
  query LecturesPageQuery {
    profile: profileYaml {
      ...ProfileFragment
    }
    social: allSocialYaml(filter: { url: { ne: null } }) {
      nodes {
        ...SocialFragment
      }
    }
  }
`
