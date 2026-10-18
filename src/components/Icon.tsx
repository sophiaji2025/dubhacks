import { createElement, type SVGProps } from 'react'

type IconNode = [string, SVGProps<SVGElement>]

const stroke = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function Icon({ nodes, className }: { nodes: IconNode[]; className?: string }) {
  return (
    <svg {...stroke} className={className}>
      {nodes.map(([tag, props], index) => createElement(tag, { ...props, key: index }))}
    </svg>
  )
}

export function Check({ className }: { className?: string }) {
  return <Icon className={className} nodes={[['path', { d: 'M20 6 9 17l-5-5' }]]} />
}

export function ArrowRight({ className }: { className?: string }) {
  return (
    <Icon
      className={className}
      nodes={[
        ['path', { d: 'M5 12h14' }],
        ['path', { d: 'm12 5 7 7-7 7' }],
      ]}
    />
  )
}

export const CATEGORY_ICON_NODES: Record<string, IconNode[]> = {
  'Food assistance': [
    ['path', { d: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2' }],
    ['path', { d: 'M7 2v20' }],
    ['path', { d: 'M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7' }],
  ],
  'Housing and shelter': [
    ['path', { d: 'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8' }],
    ['path', { d: 'M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }],
  ],
  Healthcare: [
    ['path', { d: 'M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5' }],
    ['path', { d: 'M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27' }],
  ],
  Employment: [
    ['path', { d: 'M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' }],
    ['rect', { width: '20', height: '14', x: '2', y: '6', rx: '2' }],
  ],
  Transportation: [
    ['path', { d: 'M8 6v6' }],
    ['path', { d: 'M15 6v6' }],
    ['path', { d: 'M2 12h19.6' }],
    ['path', { d: 'M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3' }],
    ['circle', { cx: '7', cy: '18', r: '2' }],
    ['path', { d: 'M9 18h5' }],
    ['circle', { cx: '16', cy: '18', r: '2' }],
  ],
  Utilities: [
    ['path', { d: 'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5' }],
    ['path', { d: 'M9 18h6' }],
    ['path', { d: 'M10 22h4' }],
  ],
  'Financial assistance': [
    ['path', { d: 'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1' }],
    ['path', { d: 'M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4' }],
  ],
  Childcare: [
    ['path', { d: 'M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5' }],
    ['path', { d: 'M15 12h.01' }],
    ['path', { d: 'M19.38 6.813A9 9 0 0 1 20.8 10.2a2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1' }],
    ['path', { d: 'M9 12h.01' }],
  ],
  'Legal assistance': [
    ['path', { d: 'M12 3v18' }],
    ['path', { d: 'm19 8 3 8a5 5 0 0 1-6 0zV7' }],
    ['path', { d: 'M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1' }],
    ['path', { d: 'm5 8 3 8a5 5 0 0 1-6 0zV7' }],
    ['path', { d: 'M7 21h10' }],
  ],
  'Mental health': [
    ['path', { d: 'M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762' }],
  ],
  'Other community services': [
    ['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }],
    ['path', { d: 'M16 3.128a4 4 0 0 1 0 7.744' }],
    ['path', { d: 'M22 21v-2a4 4 0 0 0-3-3.87' }],
    ['circle', { cx: '9', cy: '7', r: '4' }],
  ],
}

export function CategoryGlyph({ category, className }: { category: string; className?: string }) {
  const nodes = CATEGORY_ICON_NODES[category] ?? CATEGORY_ICON_NODES['Other community services']
  return <Icon className={className} nodes={nodes} />
}
