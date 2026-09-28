import { graphql } from "gatsby"
import React from "react"
import PageShell from "../../components/page-shell"

const metrics = [
  ["2,050", "annotated driving events"],
  ["35", "drivers"],
  ["5", "sensor/data streams"],
  ["ECCV 2026", "DriveX Workshop archival track"],
]

const NarratePage = ({ data }) => {
  const profile = data.profile
  const social = data.social.nodes

  return (
    <PageShell profile={profile} social={social} title="NARRATE">
      <p className="font-header font-light text-2xl text-front leading-tight mb-6">
        A Multimodal Real-World Australian Driving Dataset for Human-Centred
        Explanations in Automated Driving.
      </p>

      <img
        className="w-full object-cover border-t-4 border-line mb-8"
        src="/asset/img/narrate/narrate_sample.png"
        alt="NARRATE dataset sample"
      />

      <div className="grid md:grid-cols-4 gap-3 mb-10">
        {metrics.map(([value, label]) => (
          <div className="bg-back-light p-4 border-t-4 border-line" key={value}>
            <strong className="font-header text-2xl text-front">{value}</strong>
            <p className="font-text text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      <section className="border-t border-line pt-8 mb-10">
        <h2 className="font-header font-light text-3xl text-front leading-tight mb-4">
          Project Overview
        </h2>
        <div className="font-text text-sm leading-normal space-y-4">
          <p>
            NARRATE pairs on-road multi-sensor capture with participant
            questionnaires and span-level situational-awareness labels to support
            human-centred explanation research in automated driving.
          </p>
          <p>
            The project includes camera, LiDAR, GNSS, IMU, telemetry, and natural
            language explanation data collected in real-world Australian driving
            contexts.
          </p>
        </div>
      </section>

      <section className="border-t border-line pt-8 mb-10">
        <h2 className="font-header font-light text-3xl text-front leading-tight mb-4">
          Technical Contribution
        </h2>
        <ul className="font-text text-sm leading-normal space-y-3">
          <li>
            Designed and ran a real-world field study collecting 2,050 multimodal
            driving events from 35 drivers.
          </li>
          <li>
            Engineered Python ingestion pipelines for multi-sensor synchronization,
            cleaning, and participant-disjoint splitting.
          </li>
          <li>
            Benchmarked transformer backbones including RoBERTa, CLIP, T5, and
            BERT on perception and anticipation tasks.
          </li>
        </ul>
      </section>

      <section className="border-t border-line pt-8 mb-10">
        <h2 className="font-header font-light text-3xl text-front leading-tight mb-4">
          Dataset Pipeline
        </h2>
        <img
          className="w-full object-cover bg-back-light border-t-4 border-line"
          src="/asset/img/narrate/data_collection.png"
          alt="NARRATE data collection pipeline"
        />
      </section>

      <div className="flex flex-wrap gap-3 font-text text-sm">
        <a className="underline" href="https://arxiv.org/abs/2608.14767" target="_blank" rel="noreferrer noopener">
          Read preprint
        </a>
        <a className="underline" href="/asset/pdf/narrate-poster-drivex.pdf">
          View poster
        </a>
        <a className="underline" href="/projects/">
          Back to projects
        </a>
      </div>
    </PageShell>
  )
}

export default NarratePage

export const query = graphql`
  query NarratePageQuery {
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
