import { graphql } from "gatsby"
import React from "react"
import PageShell from "../components/page-shell"

const projects = [
  {
    id: "narrate",
    name: "NARRATE",
    label: "Dataset / ECCV 2026 DriveX Workshop",
    image: "/asset/img/narrate/narrate_sample.png",
    href: "/projects/narrate/",
    text:
      "A multimodal real-world Australian driving dataset for human-centred explanations in automated driving: 2,050 annotated events from 35 drivers, cameras, LiDAR, GNSS/IMU, telemetry, and natural language explanations.",
    tags: ["ECCV 2026", "DriveX", "2,050 events", "Multimodal", "Brisbane"],
  },
  {
    id: "x-blocks",
    name: "X-Blocks",
    label: "NLP / VLM generation framework",
    image: "/asset/img/xblocks-thumbnail.png",
    href: "https://arxiv.org/abs/2602.13248",
    text:
      "A linguistic knowledge acquisition framework for scenario-aware explanations in automated vehicles, using dependency parsing, statistical log-odds, multi-LLM annotation, and VLM evaluation.",
    tags: ["spaCy", "GPT-4o", "VLMs", "BLEU/ROUGE", "BERTScore"],
  },
  {
    id: "psylingxav",
    name: "PsyLingXAV",
    label: "XAI 2025",
    image: "/asset/img/psylingxav-thumbnail.png",
    href: "https://ceur-ws.org/Vol-4017/paper_14.pdf",
    text:
      "A psycholinguistics design framework for explainable AI in automated vehicles, connecting explanation content, linguistic form, and human-centred interpretation.",
    tags: ["XAI", "Psycholinguistics", "Human-Centred AI"],
  },
  {
    id: "explainability-in-automated-driving",
    name: "Explainability in Automated Driving",
    label: "AHFE IHIET 2026",
    image: "/asset/img/xai-av-hero.png",
    href: "https://doi.org/10.54941/ahfe1008076",
    text:
      "Research on moving from spatial attention toward human-centred reasoning in automated driving explanations.",
    tags: ["Explainability", "Attention", "Reasoning"],
  },
  {
    id: "eco-and-safe-driving-control",
    name: "Eco and Safe Driving Control",
    label: "IEEE T-ITS 2024",
    image: "/asset/img/ieee-tits-thumbnail.png",
    href: "https://doi.org/10.1109/TITS.2024.3479332",
    text:
      "Integrated intelligent control systems for eco and safe driving in autonomous vehicles.",
    tags: ["IEEE T-ITS", "Control Systems", "Autonomous Vehicles"],
  },
  {
    id: "fuzzy-adaptive-cruise-control",
    name: "Fuzzy Adaptive Cruise Control",
    label: "EAAI 2024",
    image: "/asset/img/fuzzy-acc-thumbnail.png",
    href: "https://www.sciencedirect.com/science/article/pii/S0952197624011667",
    text:
      "Fuzzy adaptive cruise control with model predictive control for automated driving.",
    tags: ["Fuzzy Logic", "MPC", "Automated Driving"],
  },
]

const ProjectsPage = ({ data }) => {
  const profile = data.profile
  const social = data.social.nodes

  return (
    <PageShell profile={profile} social={social} title="Projects">
      <p className="font-text text-sm leading-normal mb-8">
        Datasets, tools, publications, and applied AI systems from my work on
        human-centred explainable AI for automated driving.
      </p>
      <div className="space-y-6">
        {projects.map(project => (
          <article
            className="border-t-4 border-line relative flex flex-wrap bg-back-light p-4 lg:p-8 text-sm"
            id={project.id}
            key={project.id}
          >
            <div className="w-full pb-4 lg:w-2/5 lg:pr-8 lg:pb-0">
              <img className="w-full object-cover" src={project.image} alt={project.name} />
            </div>
            <div className="lg:flex-1">
              <p className="font-header text-xs uppercase opacity-60">{project.label}</p>
              <h2 className="font-header font-bold text-2xl text-front mt-1">
                {project.name}
              </h2>
              <p className="py-4">{project.text}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.map(tag => (
                  <span className="bg-lead px-2 py-1 font-header text-xs" style={{ color: "#111111" }} key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
              <a className="underline" href={project.href}>
                Open project
              </a>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  )
}

export default ProjectsPage

export const query = graphql`
  query ProjectsPageQuery {
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
