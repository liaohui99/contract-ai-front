import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/providers/ThemeProvider'
import { cn } from '@/lib/utils'

/**
 * 主题切换组件
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const themes = [
    { value: 'light', icon: Sun, label: '亮色主题' },
    { value: 'dark', icon: Moon, label: '暗色主题' },
    { value: 'system', icon: Monitor, label: '跟随系统' },
  ] as const

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-muted">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            "p-2 rounded-lg transition-all duration-200",
            "hover:bg-background/50",
            theme === value && "bg-background shadow-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          aria-label={label}
          title={label}
        >
          <Icon className="size-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}
