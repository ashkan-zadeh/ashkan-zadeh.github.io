import React from "react"
import { number, string } from "prop-types"
import SkillSvg from "@wkocjan/gatsby-theme-intro/src/components/skills/skill.svg"

const palette = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#9333ea",
  "#0891b2",
  "#ca8a04",
  "#ea580c",
]

const Skill = ({ skill, i }) => {
  const color = palette[(i - 1) % palette.length]
  const [hovered, setHovered] = React.useState(false)

  return (
    <li
      className="relative flex justify-center items-center rounded-full border-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderColor: color,
        boxShadow: hovered ? "0 10px 24px rgba(43, 49, 55, 0.14)" : "none",
        transform: hovered ? "scale(1.08)" : "scale(1)",
        transition: "transform 180ms ease, box-shadow 180ms ease",
        zIndex: hovered ? 1 : 0,
      }}
    >
      <span className="absolute font-header font-semibold text-front text-sm md:text-base px-2 text-center">
        {skill}
      </span>
      <SkillSvg className="w-full opacity-75 m-2" style={{ color }} />
    </li>
  )
}

Skill.propTypes = {
  skill: string.isRequired,
  i: number.isRequired,
}

export default Skill
