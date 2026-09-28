import React, { useEffect, useRef } from "react"

const navItems = [
  ["About", "/#about"],
  ["Publications", "/#publications"],
  ["Bio", "/#bio"],
  ["Research", "/#research"],
  ["News", "/#news"],
  ["Projects", "/projects/"],
  ["Experience", "/#experience"],
  ["Contact", "/#contact"],
]

const NeuralBackground = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    let animationFrame
    let neurons = []
    let time = 0

    const resize = () => {
      const ratio = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * ratio
      canvas.height = window.innerHeight * ratio
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      context.setTransform(ratio, 0, 0, ratio, 0, 0)

      const layerCount = window.innerWidth < 720 ? 5 : 7
      const marginX = window.innerWidth < 720 ? 34 : 72
      const marginY = 66
      neurons = []

      for (let layer = 0; layer < layerCount; layer += 1) {
        const count = layer === 0 || layer === layerCount - 1 ? 6 : 9
        const x =
          marginX +
          (layer * (window.innerWidth - marginX * 2)) / (layerCount - 1)

        for (let index = 0; index < count; index += 1) {
          const y =
            marginY +
            (index * (window.innerHeight - marginY * 2)) / (count - 1)

          neurons.push({
            bias: Math.random() * Math.PI * 2,
            index,
            layer,
            pulse: 0.7 + Math.random() * 0.8,
            r: 2.6 + Math.random() * 2.4,
            x,
            y,
          })
        }
      }
    }

    const draw = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight)
      time += 0.01

      const live = neurons.map(neuron => ({
        ...neuron,
        alpha: 0.35 + Math.sin(time * neuron.pulse + neuron.bias) * 0.25,
        liveX: neuron.x + Math.sin(time * 0.8 + neuron.bias) * 10,
        liveY: neuron.y + Math.cos(time * 0.65 + neuron.bias) * 8,
      }))

      const layers = live.reduce((acc, neuron) => {
        acc[neuron.layer] = acc[neuron.layer] || []
        acc[neuron.layer].push(neuron)
        return acc
      }, [])

      for (let layer = 0; layer < layers.length - 1; layer += 1) {
        const current = layers[layer] || []
        const next = layers[layer + 1] || []

        current.forEach((from, fromIndex) => {
          next.forEach((to, toIndex) => {
            const connectionGate = (fromIndex + toIndex + layer) % 3
            if (connectionGate === 0) return

            const intensity =
              0.08 +
              Math.max(0, Math.sin(time * 1.5 + from.bias + to.bias)) * 0.22

            context.strokeStyle = `rgba(37, 99, 235, ${intensity})`
            context.lineWidth = connectionGate === 1 ? 0.8 : 1.25
            context.beginPath()
            context.moveTo(from.liveX, from.liveY)
            context.bezierCurveTo(
              from.liveX + (to.liveX - from.liveX) * 0.45,
              from.liveY,
              from.liveX + (to.liveX - from.liveX) * 0.55,
              to.liveY,
              to.liveX,
              to.liveY
            )
            context.stroke()
          })
        })
      }

      layers.forEach((layer, layerIndex) => {
        if (layerIndex === 0) return
        const previous = layers[layerIndex - 1] || []

        layer.forEach(neuron => {
          previous.slice(0, 3).forEach(input => {
            context.strokeStyle = "rgba(17, 17, 17, 0.08)"
            context.lineWidth = 0.7
            context.beginPath()
            context.moveTo(input.liveX, input.liveY)
            context.lineTo(neuron.liveX, neuron.liveY)
            context.stroke()
          })
        })
      })

      live.forEach(neuron => {
        const halo = 8 + neuron.alpha * 10
        const gradient = context.createRadialGradient(
          neuron.liveX,
          neuron.liveY,
          0,
          neuron.liveX,
          neuron.liveY,
          halo
        )
        gradient.addColorStop(0, `rgba(37, 99, 235, ${0.28 + neuron.alpha * 0.25})`)
        gradient.addColorStop(1, "rgba(37, 99, 235, 0)")

        context.fillStyle = gradient
        context.beginPath()
        context.arc(neuron.liveX, neuron.liveY, halo, 0, Math.PI * 2)
        context.fill()

        context.fillStyle = `rgba(17, 17, 17, ${0.62 + neuron.alpha * 0.25})`
        context.strokeStyle = "rgba(255, 255, 255, 0.55)"
        context.lineWidth = 1
        context.beginPath()
        context.arc(neuron.liveX, neuron.liveY, neuron.r, 0, Math.PI * 2)
        context.fill()
        context.stroke()
      })

      animationFrame = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener("resize", resize)

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      aria-hidden="true"
      ref={canvasRef}
      style={{
        bottom: 0,
        left: 0,
        opacity: 0.2,
        pointerEvents: "none",
        position: "fixed",
        right: 0,
        top: 0,
        zIndex: 5,
      }}
    />
  )
}

const Header = ({ initials }) => (
  <>
    <NeuralBackground />
    <header
      className="z-10 bg-back border-b border-line"
      style={{ position: "sticky", top: 0 }}
    >
      <nav className="md:max-w-screen-sm lg:max-w-screen-xl mx-auto px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
        <a
          className="inline-flex w-12 h-12 font-header font-bold text-lg justify-center items-center text-center text-front border-2 border-solid border-front rounded-full"
          href="/"
        >
          {initials}
        </a>
        <div className="flex flex-wrap gap-2 font-header text-sm font-semibold uppercase">
          {navItems.map(([label, href]) => (
            <a
              className="px-2 py-1 text-front hover:opacity-75 transition-opacity duration-150"
              href={href}
              key={href}
            >
              {label}
            </a>
          ))}
        </div>
      </nav>
      <style>{`
      .text-lead {
        color: #2563eb !important;
      }

      .bg-lead,
      .text-lead-text {
        color: #111111 !important;
      }

      .bg-back-light,
      .border-t-4,
      .border,
      .rounded-lg,
      input,
      textarea {
        border-radius: 0.75rem !important;
      }

      img,
      .gatsby-image-wrapper {
        border-radius: 0.75rem;
      }

      .rounded-full,
      .rounded-full img,
      .gatsby-image-wrapper.rounded-full {
        border-radius: 9999px !important;
      }
    `}</style>
    </header>
  </>
)

export default Header
