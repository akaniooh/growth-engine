import Image from 'next/image'

export function RoverLogo({
  size = 50,
  className = '',
  color,
}: {
  size?: number
  className?: string
  color?: string
}) {
  return (
    <Image
      src="/rover-logo.png"
      alt="ROVER logo"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', mixBlendMode: 'screen' }}
    />
  )
}
