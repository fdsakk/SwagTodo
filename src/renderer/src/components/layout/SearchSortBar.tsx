import { useEffect, useMemo, useRef } from 'react'
import { ListFilter, Plus, Search } from 'lucide-react'
import {
  Select,
  SelectPopup,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Popover, PopoverPopup, PopoverTrigger } from '@renderer/components/ui/popover'
import { AnimatedCheckbox } from '@renderer/components/task-list/animated-checkbox'
import { useDomainStore, useUiStore } from '@renderer/store'
import { PRIORITY_META } from '@renderer/utils/task'
import { useShallow } from 'zustand/react/shallow'
import { Button, buttonVariants } from '../ui/button'
import { Badge } from '../ui/badge'

const SORT_OPTIONS = [
  { value: 'priority', label: 'Priority' },
  { value: 'due_date', label: 'Due date' },
  { value: 'created_at', label: 'Creation date' }
] as const

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'done', label: 'Done' }
] as const

const PRIORITY_FILTER_OPTIONS = [
  { value: 'all', label: 'All priorities' },
  { value: 'p1', label: PRIORITY_META.p1.label },
  { value: 'p2', label: PRIORITY_META.p2.label },
  { value: 'p3', label: PRIORITY_META.p3.label },
  { value: 'p4', label: PRIORITY_META.p4.label }
] as const

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
  const showDoneFilter = !showInboxFilters && selectedView !== 'project'
  const projectFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'All projects' },
      { value: 'no_project', label: 'Inbox only' },
      ...projects.map((project) => ({
        value: project.id,
        label: project.emoji ? `${project.emoji} ${project.name}` : project.name
      }))
    ],
    [projects]
  )
  const activeFilterCount =
    (showInboxFilters && inboxStatusFilter !== 'all' ? 1 : 0) +
    (showInboxFilters && inboxProjectFilter !== 'all' ? 1 : 0) +
    (showInboxFilters && inboxPriorityFilter !== 'all' ? 1 : 0) +
    (showDoneFilter && showCompleted ? 1 : 0)

  useEffect(() => {
    if (searchFocusSignal > 0) inputRef.current?.focus()
  }, [searchFocusSignal])

  return (
    <div className="flex h-12 items-center gap-2 px-4">
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
      <Popover>
        <PopoverTrigger
          render={
            <button className={buttonVariants({ size: 'sm', variant: 'outline' })} type="button" />
          }
        >
          <ListFilter size={16} />
          Filter
          {activeFilterCount > 0 && <Badge variant={'info'}>{activeFilterCount}</Badge>}
        </PopoverTrigger>
        <PopoverPopup align="end" className="w-[260px] border-app-border bg-app-card p-1 shadow-lg">
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <span className="text-xs font-medium text-app-text-muted">Sort by</span>
              <Select
                items={SORT_OPTIONS}
                onValueChange={(value) => {
                  if (value) setSortMode(value as typeof sortMode)
                }}
                value={sortMode}
              >
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup alignItemWithTrigger={false}>
                  <SelectGroup>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectPopup>
              </Select>
            </div>
            {showInboxFilters && (
              <>
                <div className="grid gap-1.5">
                  <span className="text-xs font-medium text-app-text-muted">Status</span>
                  <Select
                    items={STATUS_FILTER_OPTIONS}
                    onValueChange={(value) => {
                      if (value) setInboxStatusFilter(value as typeof inboxStatusFilter)
                    }}
                    value={inboxStatusFilter}
                  >
                    <SelectTrigger size="sm" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup alignItemWithTrigger={false}>
                      <SelectGroup>
                        {STATUS_FILTER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectPopup>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <span className="text-xs font-medium text-app-text-muted">Project</span>
                  <Select
                    items={projectFilterOptions}
                    onValueChange={(value) => {
                      if (value) setInboxProjectFilter(value)
                    }}
                    value={inboxProjectFilter}
                  >
                    <SelectTrigger size="sm" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup alignItemWithTrigger={false}>
                      <SelectGroup>
                        {projectFilterOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectPopup>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <span className="text-xs font-medium text-app-text-muted">Priority</span>
                  <Select
                    items={PRIORITY_FILTER_OPTIONS}
                    onValueChange={(value) => {
                      if (value) setInboxPriorityFilter(value as typeof inboxPriorityFilter)
                    }}
                    value={inboxPriorityFilter}
                  >
                    <SelectTrigger size="sm" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup alignItemWithTrigger={false}>
                      <SelectGroup>
                        {PRIORITY_FILTER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectPopup>
                  </Select>
                </div>
              </>
            )}
            {showDoneFilter && (
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-1 py-0.5 text-xs font-medium text-app-text-muted hover:text-app-text-secondary">
                Show done
                <AnimatedCheckbox
                  checked={showCompleted}
                  className="size-[18px] rounded-[5px]"
                  onCheckedChange={setShowCompleted}
                />
              </label>
            )}
          </div>
        </PopoverPopup>
      </Popover>
      <Button
        onClick={openCreatePanelForCurrentView}
        title="Add task"
        type="button"
        variant="outline"
        size="sm"
      >
        <Plus size={16} />
      </Button>
    </div>
  )
}
