import { graphql } from "gatsby"
import React from "react"
import PageShell from "../components/page-shell"
import archive from "../../data/news-archive.json"

const formatDate = date =>
  new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date))

const NewsArchivePage = ({ data }) => {
  const profile = data.profile
  const social = data.social.nodes

  return (
    <PageShell profile={profile} social={social} title="News Archive">
      <p className="font-text text-sm leading-normal mb-8">
        Archived automated mobility, AI, LLM, NLP, computer vision, and
        vision-language model signals from the website news feed.
      </p>
      <div className="space-y-4">
        {archive.items.map(item => (
          <article className="bg-back-light border-l-4 border-lead p-4" key={item.url}>
            <p className="font-header text-xs uppercase opacity-60">
              {item.source} / {item.category} / {formatDate(item.published)}
            </p>
            <h2 className="font-header font-bold text-front">
              <a href={item.url} target="_blank" rel="noreferrer noopener">
                {item.title}
              </a>
            </h2>
            <p className="font-text text-sm mt-2">{item.summary}</p>
          </article>
        ))}
      </div>
    </PageShell>
  )
}

export default NewsArchivePage

export const query = graphql`
  query NewsArchivePageQuery {
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
