import { useEffect, useRef } from 'react'
import { Plus, Search } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { AnimatedCheckbox } from '@renderer/components/task-list/animated-checkbox'
import { useDomainStore, useUiStore } from '@renderer/store'
import { PRIORITY_META } from '@renderer/utils/task'
import { useShallow } from 'zustand/react/shallow'

export function SearchSortBar(): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  const {
    searchQuery,
    setSearchQuery,
    sortMode,
    setSortMode,
    showCompleted,
    setShowCompleted,
    inboxStatusFilter,
    setInboxStatusFilter,
    inboxProjectFilter,
    setInboxProjectFilter,
    inboxPriorityFilter,
    setInboxPriorityFilter,
    searchFocusSignal,
    openCreatePanelForCurrentView,
    selectedView
  } = useUiStore(
    useShallow((state) => ({
      searchQuery: state.searchQuery,
      setSearchQuery: state.setSearchQuery,
      sortMode: state.sortMode,
      setSortMode: state.setSortMode,
      showCompleted: state.showCompleted,
      setShowCompleted: state.setShowCompleted,
      inboxStatusFilter: state.inboxStatusFilter,
      setInboxStatusFilter: state.setInboxStatusFilter,
      inboxProjectFilter: state.inboxProjectFilter,
      setInboxProjectFilter: state.setInboxProjectFilter,
      inboxPriorityFilter: state.inboxPriorityFilter,
      setInboxPriorityFilter: state.setInboxPriorityFilter,
      searchFocusSignal: state.searchFocusSignal,
      openCreatePanelForCurrentView: state.openCreatePanelForCurrentView,
      selectedView: state.selectedView
    }))
  )
  const projects = useDomainStore((state) => state.projects)
  const showInboxFilters = selectedView === 'inbox'

  useEffect(() => {
    if (searchFocusSignal > 0) inputRef.current?.focus()
  }, [searchFocusSignal])

  return (
    <div className="flex h-12 items-center gap-3 px-4">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-app-text-muted"
          size={14}
        />
        <input
          className="h-8 w-full bg-transparent pl-6 text-sm text-app-text placeholder:text-app-text-muted focus:outline-none"
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search"
          ref={inputRef}
          value={searchQuery}
        />
      </div>
      <Select onValueChange={(value) => setSortMode(value as typeof sortMode)} value={sortMode}>
        <SelectTrigger className="h-8 w-auto gap-1 border-0 bg-transparent px-2 text-xs text-app-text-muted shadow-none hover:text-app-text-secondary focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="due_date">Due date</SelectItem>
            <SelectItem value="created_at">Creation date</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      {showInboxFilters && (
        <>
          <Select
            onValueChange={(value) => setInboxStatusFilter(value as typeof inboxStatusFilter)}
            value={inboxStatusFilter}
          >
            <SelectTrigger className="h-8 w-auto gap-1 border-0 bg-transparent px-2 text-xs text-app-text-muted shadow-none hover:text-app-text-secondary focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value) => setInboxProjectFilter(value)}
            value={inboxProjectFilter}
          >
            <SelectTrigger className="h-8 w-auto max-w-[180px] gap-1 border-0 bg-transparent px-2 text-xs text-app-text-muted shadow-none hover:text-app-text-secondary focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All projects</SelectItem>
                <SelectItem value="no_project">Inbox only</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.emoji ? `${project.emoji} ${project.name}` : project.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value) => setInboxPriorityFilter(value as typeof inboxPriorityFilter)}
            value={inboxPriorityFilter}
          >
            <SelectTrigger className="h-8 w-auto gap-1 border-0 bg-transparent px-2 text-xs text-app-text-muted shadow-none hover:text-app-text-secondary focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="p1">{PRIORITY_META.p1.label}</SelectItem>
                <SelectItem value="p2">{PRIORITY_META.p2.label}</SelectItem>
                <SelectItem value="p3">{PRIORITY_META.p3.label}</SelectItem>
                <SelectItem value="p4">{PRIORITY_META.p4.label}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </>
      )}
      {!showInboxFilters && selectedView !== 'project' && (
        <label className="flex cursor-pointer items-center gap-2 px-2 text-xs text-app-text-muted hover:text-app-text-secondary">
          <AnimatedCheckbox
            checked={showCompleted}
            className="size-[18px] rounded-[5px]"
            onCheckedChange={setShowCompleted}
          />
          Show done
        </label>
      )}
      <button
        className="flex h-7 w-7 items-center justify-center rounded-md text-app-text-secondary hover:bg-app-active hover:text-app-text"
        onClick={openCreatePanelForCurrentView}
        title="Add task"
        type="button"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}
