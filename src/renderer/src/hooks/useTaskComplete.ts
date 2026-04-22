import confetti from 'canvas-confetti'
import { useCallback } from 'react'
import { useDomainStore } from '@renderer/store'

let confettiInstance: confetti.CreateTypes | null = null

function getConfetti(): confetti.CreateTypes {
  if (confettiInstance) return confettiInstance
  const canvas = document.createElement('canvas')
  canvas.style.position = 'fixed'
  canvas.style.inset = '0'
  canvas.style.width = '100vw'
  canvas.style.height = '100vh'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '9999'
  document.body.appendChild(canvas)
  confettiInstance = confetti.create(canvas, { resize: true, useWorker: false })
  return confettiInstance
}

export function useTaskComplete(): (taskId: string) => void {
  const tasks = useDomainStore((state) => state.tasks)
  const toggleTaskComplete = useDomainStore((state) => state.toggleTaskComplete)

  return useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId)
      const wasCompleted = task?.completed ?? true

      toggleTaskComplete(taskId)

      if (!wasCompleted) {
        const fire = getConfetti()
        void fire({
          particleCount: 80,
          spread: 55,
          origin: { x: 0.02, y: 0.02 },
          angle: 315,
          startVelocity: 45,
          gravity: 1,
          ticks: 150,
          colors: ['#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']
        })
      }
    },
    [tasks, toggleTaskComplete]
  )
}
