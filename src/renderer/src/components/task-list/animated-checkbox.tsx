import { cn } from "@renderer/utils/cn"
import { motion } from "framer-motion"

interface AnimatedCheckboxProps {
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
}

export function AnimatedCheckbox({
  checked,
  onCheckedChange,
  className
}: AnimatedCheckboxProps): React.JSX.Element {
  return (
    <button
      aria-checked={checked}
      className={cn(
        "flex size-[22px] shrink-0 items-center justify-center rounded-[6px] border-[1.5px] transition-colors duration-200",
        checked
          ? "border-transparent bg-foreground"
          : "border-muted-foreground/40 bg-transparent hover:border-muted-foreground/60",
        className
      )}
      onClick={(event) => {
        event.stopPropagation()
        onCheckedChange?.(!checked)
      }}
      role="checkbox"
      type="button"
    >
      <svg className="size-full text-background" viewBox="0 0 20 20">
        <motion.path
          animate={{
            pathLength: checked ? 1 : 0,
            opacity: checked ? 1 : 0
          }}
          d="M 0 4.5 L 3.182 8 L 10 0"
          fill="transparent"
          initial={false}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          transform="translate(5 6)"
          transition={{
            pathLength: { ease: "easeOut", duration: 0.3 },
            opacity: { duration: 0 }
          }}
        />
      </svg>
    </button>
  )
}
