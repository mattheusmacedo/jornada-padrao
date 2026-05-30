export type MusicModelId =
  | 'musical-note'
  | 'trumpet'
  | 'loudspeaker'
  | 'bj-mixer'
  | 'headphones2'
  | 'clarinet'
  | 'guitar'
  | 'microphone'
  | 'accordion'
  | 'conga'
  | 'drum'
  | 'electric-guitar'

export type BurstTextureSpec = {
  color: string
  ao?: string
  alpha?: string
  emissive?: string
  height?: string
  metalness?: string
  normal?: string
  roughness?: string
}

export type BurstModelSpec = {
  id: MusicModelId
  label: string
  path: string
  textures: BurstTextureSpec
}

export type MusicBurstLaneConfig = {
  id: string
  label: string
  enabled: boolean
  x: number
  y: number
  curveX: number
  curveY: number
  spreadX: number
  spreadY: number
  scale: number
  speed: number
  depth: number
  lift: number
  spin: number
  models: MusicModelId[]
}

function createModelSpec(
  id: MusicModelId,
  label: string,
  folder: string,
  fileName: string,
  textureStem: string,
  options: { alpha?: boolean; colorMap?: string; emissive?: boolean; emissiveMap?: string; metalness?: boolean } = {},
): BurstModelSpec {
  const textureBase = `/models/${folder}/textures/${textureStem}`

  return {
    id,
    label,
    path: `/models/${folder}/${fileName}`,
    textures: {
      color: options.colorMap ?? `${textureBase}-col-metalness-4k.webp`,
      ao: `${textureBase}-ao-metalness-4k.webp`,
      ...(options.alpha ? { alpha: `${textureBase}-trans-metalness-4k.webp` } : {}),
      height: `${textureBase}-height-metalness-4k.webp`,
      normal: `${textureBase}-nrm-metalness-4k.webp`,
      roughness: `${textureBase}-roughness-metalness-4k.webp`,
      ...(options.metalness === false ? {} : { metalness: `${textureBase}-metalness-metalness-4k.webp` }),
      ...(options.emissive ? { emissive: options.emissiveMap ?? `${textureBase}-emissive-metalness-4k.webp` } : {}),
    },
  }
}

export const MUSIC_BURST_MODEL_SPECS: BurstModelSpec[] = [
  createModelSpec('musical-note', 'Musical note', 'musical-note-icon-fbx', 'musical-note-icon.glb', 'musical-note-icon-005', {
    colorMap: '/models/musical-note-icon-fbx/textures/musical-note-icon-005-col-brand-preview.webp',
  }),
  createModelSpec('trumpet', 'Trumpet', 'trumpet-icon-fbx', 'trumpet-icon.glb', 'trumpet-icon-001', {
    colorMap: '/models/trumpet-icon-fbx/textures/trumpet-icon-001-col-brand-preview.webp',
  }),
  createModelSpec('loudspeaker', 'Loudspeaker', 'loudspeaker-textures-fbx', 'loudspeaker.glb', 'loudspeaker-010', { alpha: true }),
  createModelSpec('bj-mixer', 'Mixer', 'bj-mixer-icon-fbx', 'bj-mixer-icon.glb', 'bj-mixer-icon-002', {
    colorMap: '/models/bj-mixer-icon-fbx/textures/bj-mixer-icon-002-col-brand-preview.webp',
    emissive: true,
    emissiveMap: '/models/bj-mixer-icon-fbx/textures/bj-mixer-icon-002-emissive-brand-preview.webp',
  }),
  createModelSpec('headphones2', 'Headphones', 'headphones-icon2-fbx', 'headphones-icon.glb', 'headphones-icon-013', {
    colorMap: '/models/headphones-icon2-fbx/textures/headphones-icon-013-col-brand-preview.webp',
    metalness: false,
  }),
  createModelSpec('clarinet', 'Clarinet', 'clarinet-icon-fbx', 'clarinet-icon.glb', 'clarinet-icon-001', {
    colorMap: '/models/clarinet-icon-fbx/textures/clarinet-icon-001-col-brand-preview-2.webp',
  }),
  createModelSpec('guitar', 'Guitar', 'guitar-icon-fbx', 'guitar-icon.glb', 'guitar-icon-001', {
    colorMap: '/models/guitar-icon-fbx/textures/guitar-icon-001-col-brand-preview.webp',
  }),
  createModelSpec('microphone', 'Microphone', 'microphone-icon-fbx', 'microphone-icon.glb', 'microphone-icon-003', {
    colorMap: '/models/microphone-icon-fbx/textures/microphone-icon-003-col-brand-preview.webp',
  }),
  createModelSpec('accordion', 'Accordion', 'accordion-icon-fbx', 'accordion-icon.glb', 'accordion-icon-001', {
    colorMap: '/models/accordion-icon-fbx/textures/accordion-icon-001-col-brand-preview-3.webp',
  }),
  createModelSpec('conga', 'Conga', 'conga-icon-fbx', 'conga-icon.glb', 'conga-icon-001', {
    colorMap: '/models/conga-icon-fbx/textures/conga-icon-001-col-brand-preview.webp',
  }),
  createModelSpec('drum', 'Drum', 'drum-icon-fbx', 'drum-icon.glb', 'drum-icon-004', {
    colorMap: '/models/drum-icon-fbx/textures/drum-icon-004-col-brand-preview.webp',
  }),
  createModelSpec('electric-guitar', 'Electric guitar', 'electric-guitar-icon-fbx', 'electric-guitar-icon.glb', 'electric-guitar-icon-002', {
    colorMap: '/models/electric-guitar-icon-fbx/textures/electric-guitar-icon-002-col-brand-preview.webp',
  }),
]

export const MUSIC_MODEL_LABELS = MUSIC_BURST_MODEL_SPECS.reduce<Record<MusicModelId, string>>(
  (labels, spec) => ({ ...labels, [spec.id]: spec.label }),
  {} as Record<MusicModelId, string>,
)

export const DEFAULT_BURST_MODEL_IDS = MUSIC_BURST_MODEL_SPECS.map(({ id }) => id)

function rotateModelIds(offset: number) {
  return DEFAULT_BURST_MODEL_IDS.map((_, index) => (
    DEFAULT_BURST_MODEL_IDS[(index + offset) % DEFAULT_BURST_MODEL_IDS.length]
  ))
}

function lane(
  id: string,
  label: string,
  x: number,
  y: number,
  curveX: number,
  curveY: number,
  modelOffset: number,
): MusicBurstLaneConfig {
  return {
    id,
    label,
    enabled: true,
    x,
    y,
    curveX,
    curveY,
    spreadX: 0.01,
    spreadY: 0.02,
    scale: 1,
    speed: 1,
    depth: 4,
    lift: 0,
    spin: 2.15,
    models: rotateModelIds(modelOffset),
  }
}

export const DEFAULT_MUSIC_BURST_LANES: MusicBurstLaneConfig[] = [
  lane('top-right-corner', 'Top right corner', 1.16, -0.16, 0.16, -0.14, 0),
  lane('top-center', 'Top center', 0.5, -0.16, 0.02, -0.16, 1),
  lane('top-left-corner', 'Top left corner', -0.16, -0.16, -0.16, -0.14, 2),
  lane('upper-left-edge', 'Upper left edge', -0.18, 0.28, -0.22, -0.1, 3),
  lane('upper-right-edge', 'Upper right edge', 1.18, 0.28, 0.22, -0.1, 4),
  lane('left-center', 'Left center', -0.16, 0.5, -0.18, 0, 5),
  lane('right-center', 'Right center', 1.16, 0.5, 0.18, 0, 6),
  lane('lower-left-edge', 'Lower left edge', -0.18, 0.72, -0.22, 0.1, 7),
  lane('lower-right-edge', 'Lower right edge', 1.18, 0.72, 0.22, 0.1, 8),
  lane('bottom-right-corner', 'Bottom right corner', 1.16, 1.16, 0.16, 0.14, 9),
  lane('bottom-center', 'Bottom center', 0.5, 1.16, 0.02, 0.16, 10),
  lane('bottom-left-corner', 'Bottom left corner', -0.16, 1.16, -0.16, 0.14, 11),
]

export function cloneMusicBurstLanes() {
  return DEFAULT_MUSIC_BURST_LANES.map((burstLane) => ({
    ...burstLane,
    models: [...burstLane.models],
  }))
}
