import type { Project } from "@renderer/types"
import { v4 as uuidv4 } from "uuid"
import {
  normalizeProjectInput,
  normalizeProjectPatch
} from "../../shared/normalize"
import type { DomainActions, DomainStoreSet } from "../../shared/types"
import { nowIso, removeById } from "../../shared/utils"
import {
  detachProjectFromTasks,
  removeProjectSessions
} from "../helpers/relations"

type ProjectActions = Pick<
  DomainActions,
  "addProject" | "updateProject" | "deleteProject"
>

export const createProjectActions = (set: DomainStoreSet): ProjectActions => ({
  addProject: (input) => {
    const normalized = normalizeProjectInput(input)
    if (!normalized) return ""

    const project: Project = {
      id: uuidv4(),
      ...normalized,
      createdAt: nowIso()
    }

    set((state) => ({ projects: [...state.projects, project] }))
    return project.id
  },
  updateProject: (projectId, updates) =>
    set((state) => {
      const index = state.projects.findIndex(
        (project) => project.id === projectId
      )
      if (index === -1) return state

      const current = state.projects[index]
      const patch = normalizeProjectPatch(current, updates)
      if (!patch) return state

      const projects = state.projects.slice()
      projects[index] = { ...current, ...patch }
      return { projects }
    }),
  deleteProject: (projectId) =>
    set((state) => {
      const projects = removeById(state.projects, projectId)
      if (projects === state.projects) return state

      const updatedAt = nowIso()
      const { tasks } = detachProjectFromTasks(state, projectId, updatedAt)
      const { sessions } = removeProjectSessions(state, projectId)

      return { projects, tasks, sessions }
    })
})
