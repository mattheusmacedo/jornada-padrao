export type MotionReference = {
  label: string
  href: string
  takeaway: string
}

export type HandoffPoint = {
  label: string
  detail: string
}

export type StateMachineTransition = {
  event: string
  from: string
  to: string
  guard: string
  action: string
}

export const latestMotionWork: HandoffPoint[] = [
  {
    label: 'Alpha-video state machine',
    detail: 'Conclusion now starts with the single dance clip, settles into idle, queues one feature clip at a time, and swaps alpha videos through the dual-slot AlphaVideo player to avoid transparent flashes.',
  },
  {
    label: 'Tap gesture rule',
    detail: 'A fresh gesture resets after 560ms. The second tap queues a dance and triggers the rare object burst. The third and later taps upgrade the queued clip into a character cameo without firing the full burst again.',
  },
  {
    label: '3D music burst overlay',
    detail: 'The burst uses textured FBX music objects, round-robin lane selection, lane-specific model rotations, capped particle count, and per-lane depth/curve/spin controls.',
  },
  {
    label: 'Burst sandbox',
    detail: 'The sandbox exposes the same global burst settings and lane parameters used in production, so motion tuning can happen visually before values are handed to developers.',
  },
  {
    label: 'Measured FLIP handoff',
    detail: 'Card-to-detail motion is documented as measured shell geometry plus source/destination faces, with a single owner for shadows and no layoutId/manual-FLIP mixing.',
  },
]

export const industryMotionReferences: MotionReference[] = [
  {
    label: 'Apple HIG: Motion',
    href: 'https://developer.apple.com/design/human-interface-guidelines/motion',
    takeaway: 'Motion should be purposeful, brief, optional, cancelable, and tied to user expectations.',
  },
  {
    label: 'Material Design: Duration and easing',
    href: 'https://m1.material.io/motion/duration-easing.html',
    takeaway: 'Duration should respond to distance and scope; short frequent interactions must not make people wait.',
  },
  {
    label: 'Atlassian Design System: Motion',
    href: 'https://atlassian.design/foundations/motion',
    takeaway: 'Document each motion event by duration, easing curve, and animated property; package repeatable behavior as semantic tokens.',
  },
  {
    label: 'IBM Carbon: Motion',
    href: 'https://carbondesignsystem.com/elements/motion/overview/',
    takeaway: 'Separate productive motion from expressive motion so product UI stays fast while special moments can carry brand weight.',
  },
  {
    label: 'W3C WCAG Technique C39',
    href: 'https://w3c.github.io/wcag/techniques/css/C39',
    takeaway: 'Interaction-triggered motion needs a reduced-motion path through user-agent/system preferences.',
  },
  {
    label: 'Stately/XState: Events and transitions',
    href: 'https://stately.ai/docs/transitions',
    takeaway: 'State machine handoff should name states, events, guards, actions, transitions, and delayed/eventless behavior explicitly.',
  },
]

export const stateMachineHandoff = {
  intent: 'Keep the conclusion illustration playful without making the system nondeterministic: one active clip, one pending clip, clear tap windows, and no stacked burst spam.',
  states: [
    { label: 'Initial dance', detail: 'On mount, play conclusao-dance.' },
    { label: 'Idle loop', detail: 'Base idle clip loops in AlphaVideo when no pending clip exists.' },
    { label: 'Dance pending', detail: 'Second tap queues conclusao-dance.' },
    { label: 'Character pending', detail: 'Third or later taps replace/upgrade the pending clip with the next character cameo.' },
    { label: 'Feature clip playing', detail: 'Any dance or character clip plays once, then returns to idle before pending work is consumed.' },
  ],
  transitions: [
    {
      event: 'MOUNT',
      from: 'none',
      to: 'Initial dance',
      guard: 'Always on route entry',
      action: 'setCurrentVideo(conclusao-dance)',
    },
    {
      event: 'VIDEO_ENDED',
      from: 'Feature clip playing',
      to: 'Idle loop',
      guard: 'currentVideo !== idle',
      action: 'setCurrentVideo(idle), reset tap accumulator',
    },
    {
      event: 'VIDEO_ENDED',
      from: 'Idle loop',
      to: 'Feature clip playing',
      guard: 'pendingVideoRef has a queued clip',
      action: 'consume pendingVideoRef and play it once',
    },
    {
      event: 'SECOND_TAP',
      from: 'Idle loop or Feature clip playing',
      to: 'Dance pending',
      guard: 'Tap interval <= 560ms',
      action: 'queueDance(); burst(origin, intensity 0.86, stagger 52ms)',
    },
    {
      event: 'THIRD_TAP_PLUS',
      from: 'Dance pending',
      to: 'Character pending',
      guard: 'Same gesture window; character queue has options',
      action: 'queueNextCharacter(); do not fire full burst again',
    },
  ] satisfies StateMachineTransition[],
  guardrails: [
    'Visual tap feedback is immediate and independent from the video state.',
    'The full 3D burst fires only on the second tap in a fresh gesture.',
    'A feature clip is never interrupted by the pending clip; pending work is consumed from idle.',
    'Character cameo order is shuffled and avoids repeating the previous first cameo when possible.',
  ],
}

export const burstLogicHandoff = {
  trigger: 'MusicNotesOverlay.burst(point, { intensity, stagger, laneStaggerMs, laneId })',
  constants: [
    { label: 'Gesture window', detail: '560ms between taps for the special burst path.' },
    { label: 'Production intensity', detail: '0.86 for the conclusion special burst.' },
    { label: 'Lane stagger', detail: '52ms between lanes when the full burst is staggered.' },
    { label: 'Particle cap', detail: '34 live particles; oldest particles are disposed before new ones are added.' },
  ],
  algorithm: [
    'Normalize amount, size, speed, and duration into bounded ranges.',
    'Convert intensity into extra particles, then clamp the total count from 1 to 10.',
    'Select enabled lanes in round-robin order unless a specific laneId is requested.',
    'Pick models from the selected lane model list, also round-robin per lane.',
    'Convert the screen-space origin and lane target into Three.js world coordinates.',
    'Apply lane curve, spread, depth, lift, speed, scale, and spin during particle creation.',
    'Use ease-out cubic progress, a sine arc, and depth growth so objects leave fast and settle naturally.',
  ],
}

export const handoffQualityBar: HandoffPoint[] = [
  {
    label: 'Intent',
    detail: 'Name why the motion exists: feedback, spatial continuity, state change, celebration, or brand expression.',
  },
  {
    label: 'Trigger and state',
    detail: 'Document the exact event, starting state, target state, guard, and action. Avoid ambiguous phrases like "when it feels right".',
  },
  {
    label: 'Token mapping',
    detail: 'Include duration, easing, delay/stagger, property, and ownership. Note when code owns geometry versus Framer Motion layout projection.',
  },
  {
    label: 'Assets',
    detail: 'List clip/model paths, source files, export settings, alpha requirements, texture maps, and fallback behavior.',
  },
  {
    label: 'Accessibility',
    detail: 'Provide a reduced-motion path, never make motion the only signal, and keep frequent interactions brief and cancelable.',
  },
  {
    label: 'QA',
    detail: 'Verify route entry, repeated taps, video-end transitions, reduced motion, mobile viewport, desktop viewport, and particle cleanup.',
  },
]
