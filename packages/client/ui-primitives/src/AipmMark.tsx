import type { IconProps } from './icons/props.ts'

/**
 * Simin's four-point star, using the surrounding ink color.
 * @param props - Icon size and optional layout class.
 * @returns An aria-hidden mark; the adjacent wordmark supplies the name.
 */
export function AipmMark({ size = 24, className }: IconProps) {
  return <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 1.5l2.1 7.4 7.4 2.1-7.4 2.1-2.1 7.4-2.1-7.4-7.4-2.1 7.4-2.1z" fill="currentColor" />
  </svg>
}
