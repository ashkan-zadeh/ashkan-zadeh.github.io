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
        EGD103 Computing and Data for Engineers
      </h2>
      <div className="font-text text-sm leading-normal space-y-4 mb-6">
        <p>
          Professional engineers spend much of their working lives using computing
          tools to support design and problem solving. In this unit, you will become
          proficient in designing and implementing simple algorithms to create
          software for solving engineering problems.
        </p>
        <p>
          As a professional engineer having computing skills are key to automating
          tedious tasks and creatively constructing innovative processes that go
          beyond off-the-shelf software solutions. With the ubiquitous nature of
          large data sets, whether that be about transport systems, building energy
          use or chemical processes, professional engineers are often required to
          use computing as a key tool within engineering design methods.
        </p>
        <p>
          This unit is an introductory unit providing you with foundational skills.
          No prior programming experience is assumed.
        </p>
      </div>
      <p className="font-header text-sm font-semibold uppercase mb-3">
        Sample lecture
      </p>
      <YouTubeVideo videoId="c3le1rQ9Gxs" title="EGD103 Computing and Data for Engineers — sample lecture by Ashkan Yousefi Zadeh" />
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
