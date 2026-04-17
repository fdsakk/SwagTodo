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
import { AnimatedCheckbox } from '@renderer/components/animated-checkbox'
import useAppStore from '@renderer/store/useAppStore'
import { useShallow } from 'zustand/react/shallow'

export default function SearchSortBar(): React.JSX.Element {
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
    inputRef.current?.focus()
  }, [searchFocusSignal])

  return (
    <div className="flex h-12 items-center gap-3 px-4">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-zinc-600"
          size={14}
        />
        <input
          className="h-8 w-full bg-transparent pl-6 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search"
          ref={inputRef}
          value={searchQuery}
        />
      </div>
      <Select onValueChange={(value) => setSortMode(value as typeof sortMode)} value={sortMode}>
        <SelectTrigger className="h-8 w-auto gap-1 border-0 bg-transparent px-2 text-xs text-zinc-500 shadow-none hover:text-zinc-300 focus:ring-0">
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
        <label className="flex cursor-pointer items-center gap-2 px-2 text-xs text-zinc-500 hover:text-zinc-300">
          <AnimatedCheckbox
            checked={showCompleted}
            className="size-[18px] rounded-[5px]"
            onCheckedChange={setShowCompleted}
          />
          Show done
        </label>
      )}
      <button
        className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100"
        onClick={openCreatePanelForCurrentView}
        title="Add task"
        type="button"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}
