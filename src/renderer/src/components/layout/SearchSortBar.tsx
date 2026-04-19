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
import useAppStore from '@renderer/store/useAppStore'
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
    searchFocusSignal,
    openCreatePanelForCurrentView,
    selectedView
  } = useAppStore(
    useShallow((state) => ({
      searchQuery: state.searchQuery,
      setSearchQuery: state.setSearchQuery,
      sortMode: state.sortMode,
      setSortMode: state.setSortMode,
      showCompleted: state.showCompleted,
      setShowCompleted: state.setShowCompleted,
      searchFocusSignal: state.searchFocusSignal,
      openCreatePanelForCurrentView: state.openCreatePanelForCurrentView,
      selectedView: state.selectedView
    }))
  )

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
      {selectedView !== 'project' && (
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
