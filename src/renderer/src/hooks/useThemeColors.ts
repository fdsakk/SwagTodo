import { useEffect, useState } from "react"

export function useThemeColors() {
  const [colors, setColors] = useState(() => readColors())

  useEffect(() => {
    const obs = new MutationObserver(() => setColors(readColors()))
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"]
    })
    return () => obs.disconnect()
  }, [])

  return colors
}

function readColors() {
  const style = getComputedStyle(document.documentElement)
  return {
    accent: style.getPropertyValue("--app-accent").trim() || "#e4e4e7",
    bg: style.getPropertyValue("--app-bg").trim() || "#0d0d0d",
    text: style.getPropertyValue("--app-text").trim() || "#e4e4e7"
  }
}
