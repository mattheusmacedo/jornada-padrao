import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import type {
  BufferGeometry,
  Group,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  Texture,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from 'three'
import { DEFAULT_MUSIC_NOTE_BURST_SETTINGS } from './musicNotesConfig'
import type { MusicNoteBurstSettings } from './musicNotesConfig'
import {
  DEFAULT_BURST_MODEL_IDS,
  DEFAULT_MUSIC_BURST_LANES,
  MUSIC_BURST_MODEL_SPECS,
} from './musicBurstConfig'
import { repairMusicModel } from './musicModelTransforms'
import type {
  BurstTextureSpec,
  MusicBurstLaneConfig,
  MusicModelId,
} from './musicBurstConfig'

type ThreeModule = typeof import('three')
type BurstOptions = {
  intensity?: number
  laneId?: string
  laneStaggerMs?: number
  stagger?: boolean
}

export type MusicNotesOverlayHandle = {
  burst: (point: { x: number; y: number }, options?: BurstOptions) => void
}

type Props = {
  className?: string
  lanes?: MusicBurstLaneConfig[]
  settings?: MusicNoteBurstSettings
}

type NoteParticle = {
  group: Group
  materials: MeshStandardMaterial[]
  modelId?: MusicModelId
  start: Vector3
  velocity: Vector3
  curve: Vector3
  spin: Vector3
  bornAt: number
  lifeMs: number
  baseScale: number
  lift: number
  drift: number
}

type BurstModelTemplate = {
  id: MusicModelId
  template: Group
}

type BurstTextureMaps = Partial<Record<keyof BurstTextureSpec, Texture>>

type OverlayScene = {
  three: ThreeModule
  scene: Scene
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  particles: NoteParticle[]
  modelTemplates: Partial<Record<MusicModelId, BurstModelTemplate>>
  lanes: MusicBurstLaneConfig[]
  nextTemplateIndex: number
  nextLaneIndex: number
  nextModelIndexByLane: Record<string, number>
  pendingBurstTimers: Array<ReturnType<typeof window.setTimeout>>
  noteGeometry: BufferGeometry
  stemGeometry: BufferGeometry
  flagGeometry: BufferGeometry
  width: number
  height: number
  rafId: number | null
  lastFrameAt: number
}

const NORMALIZED_MODEL_SIZE = 0.74
const BASE_PARTICLE_SCALE = 0.34
const MAX_PARTICLES = 34
const DEFAULT_LANE_STAGGER_MS = 46
const MATERIAL_TEXTURE_KEYS = [
  'aoMap',
  'alphaMap',
  'bumpMap',
  'emissiveMap',
  'map',
  'metalnessMap',
  'normalMap',
  'roughnessMap',
] as const

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3)
}

function normalizeSettings(settings?: MusicNoteBurstSettings): MusicNoteBurstSettings {
  return {
    amount: Math.round(clamp(settings?.amount ?? DEFAULT_MUSIC_NOTE_BURST_SETTINGS.amount, 1, 12)),
    size: clamp(settings?.size ?? DEFAULT_MUSIC_NOTE_BURST_SETTINGS.size, 0.45, 2.2),
    speed: clamp(settings?.speed ?? DEFAULT_MUSIC_NOTE_BURST_SETTINGS.speed, 0.35, 1.8),
    duration: clamp(settings?.duration ?? DEFAULT_MUSIC_NOTE_BURST_SETTINGS.duration, 0.65, 2.4),
  }
}

function normalizeLaneConfig(lanes?: MusicBurstLaneConfig[]) {
  const sourceLanes = lanes?.length ? lanes : DEFAULT_MUSIC_BURST_LANES

  return sourceLanes.map((lane) => ({
    ...lane,
    models: lane.models.length ? [...lane.models] : [...DEFAULT_BURST_MODEL_IDS],
  }))
}

function createFlagGeometry(THREE: ThreeModule) {
  const shape = new THREE.Shape()
  shape.moveTo(0, 0.18)
  shape.bezierCurveTo(0.18, 0.16, 0.26, 0.04, 0.19, -0.06)
  shape.bezierCurveTo(0.14, -0.02, 0.09, 0.01, 0.03, 0.02)
  shape.lineTo(0.03, 0.18)
  shape.closePath()

  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.025,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.01,
    bevelThickness: 0.006,
  })
}

function isMesh(object: Object3D): object is Mesh {
  return 'isMesh' in object && (object as Mesh).isMesh
}

function createBurstMaterial(THREE: ThreeModule, intensity: number) {
  return new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#ffffff',
    emissiveIntensity: 0.18 + intensity * 0.18,
    metalness: 0.2,
    roughness: 0.24,
    transparent: false,
  })
}

function createTexturedBurstMaterial(THREE: ThreeModule, textures: BurstTextureMaps, doubleSided = false) {
  const material = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    map: textures.color ?? null,
    aoMap: textures.ao ?? null,
    aoMapIntensity: textures.ao ? 0.8 : 1,
    alphaMap: textures.alpha ?? null,
    alphaTest: textures.alpha ? 0.05 : 0,
    bumpMap: textures.height ?? null,
    bumpScale: textures.height ? 0.015 : 0,
    emissive: textures.emissive ? '#ffffff' : '#170713',
    emissiveMap: textures.emissive ?? null,
    emissiveIntensity: textures.emissive ? 0.25 : 0.035,
    metalness: textures.metalness ? 0.86 : 0.24,
    metalnessMap: textures.metalness ?? null,
    normalMap: textures.normal ?? null,
    roughness: textures.roughness ? 0.72 : 0.38,
    roughnessMap: textures.roughness ?? null,
    side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    transparent: Boolean(textures.alpha),
  })

  if (textures.normal) material.normalScale.set(0.72, 0.72)

  return material
}

function prepareModelTemplate(THREE: ThreeModule, object: Group) {
  const holder = new THREE.Group()
  holder.add(object)

  const box = new THREE.Box3().setFromObject(object)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  object.position.sub(center)

  const maxDimension = Math.max(size.x, size.y, size.z, 0.001)
  holder.scale.setScalar(NORMALIZED_MODEL_SIZE / maxDimension)

  return holder
}

function ensureAmbientOcclusionUv(mesh: Mesh) {
  const uv = mesh.geometry.getAttribute('uv')
  if (uv && !mesh.geometry.getAttribute('uv2')) {
    mesh.geometry.setAttribute('uv2', uv.clone())
  }
}

function applyTexturedMaterial(THREE: ThreeModule, object: Object3D, textures: BurstTextureMaps, modelId: MusicModelId) {
  const material = createTexturedBurstMaterial(THREE, textures, modelId === 'drum')

  object.traverse((child) => {
    if (!isMesh(child)) return
    ensureAmbientOcclusionUv(child)
    child.material = material
  })
}

function loadTexture(
  THREE: ThreeModule,
  textureLoader: TextureLoader,
  path: string,
  textureType: keyof BurstTextureSpec,
) {
  return new Promise<Texture | null>((resolve) => {
    textureLoader.load(
      path,
      (texture) => {
        if (textureType === 'color' || textureType === 'emissive') {
          texture.colorSpace = THREE.SRGBColorSpace
        }
        texture.anisotropy = 4
        resolve(texture)
      },
      undefined,
      () => resolve(null),
    )
  })
}

async function loadTextureMaps(
  THREE: ThreeModule,
  textureLoader: TextureLoader,
  textureSpecs: BurstTextureSpec,
) {
  const textureEntries = await Promise.all(
    Object.entries(textureSpecs).map(async ([textureType, path]) => [
      textureType,
      await loadTexture(THREE, textureLoader, path, textureType as keyof BurstTextureSpec),
    ] as const),
  )
  const textures: BurstTextureMaps = {}

  textureEntries.forEach(([textureType, texture]) => {
    if (texture) textures[textureType as keyof BurstTextureSpec] = texture
  })

  return textures
}

function disposeMaterial(material: Material) {
  const textures = new Set<Texture>()
  const materialWithTextures = material as Material & Partial<Record<(typeof MATERIAL_TEXTURE_KEYS)[number], Texture | null>>

  MATERIAL_TEXTURE_KEYS.forEach((textureKey) => {
    const texture = materialWithTextures[textureKey]
    if (texture) textures.add(texture)
  })

  textures.forEach((texture) => texture.dispose())
  material.dispose()
}

function disposeParticleMaterials(particle: NoteParticle) {
  particle.materials.forEach(disposeMaterial)
}

function trimParticleQueue(overlay: OverlayScene) {
  while (overlay.particles.length >= MAX_PARTICLES) {
    const particle = overlay.particles.shift()
    if (!particle) break
    overlay.scene.remove(particle.group)
    disposeParticleMaterials(particle)
  }
}

function clearPendingBurstTimers(overlay: OverlayScene) {
  overlay.pendingBurstTimers.forEach((timer) => window.clearTimeout(timer))
  overlay.pendingBurstTimers = []
}

function disposeModelObject(object: Object3D | null) {
  if (!object) return

  const geometries = new Set<BufferGeometry>()
  const materials = new Set<Material>()

  object.traverse((child) => {
    if (!isMesh(child)) return
    geometries.add(child.geometry)
    const childMaterials = Array.isArray(child.material) ? child.material : [child.material]
    childMaterials.forEach((material) => {
      if (material) materials.add(material)
    })
  })

  geometries.forEach((geometry) => geometry.dispose())
  materials.forEach(disposeMaterial)
}

function getNextLane(overlay: OverlayScene, laneId?: string) {
  if (laneId) {
    return overlay.lanes.find((lane) => lane.id === laneId) ?? null
  }

  const enabledLanes = overlay.lanes.filter((lane) => lane.enabled)
  if (enabledLanes.length === 0) return null

  const lane = enabledLanes[overlay.nextLaneIndex % enabledLanes.length]
  overlay.nextLaneIndex += 1

  return lane
}

function getBurstLaneSequence(overlay: OverlayScene, count: number, laneId?: string) {
  const lanes: MusicBurstLaneConfig[] = []

  for (let i = 0; i < count; i += 1) {
    const lane = getNextLane(overlay, laneId)
    if (!lane) break
    lanes.push(lane)
  }

  return lanes
}

function getNextModelTemplate(overlay: OverlayScene, lane: MusicBurstLaneConfig) {
  const laneModels = lane.models.length ? lane.models : DEFAULT_BURST_MODEL_IDS
  const laneTemplates = laneModels
    .map((modelId) => overlay.modelTemplates[modelId])
    .filter((template): template is BurstModelTemplate => Boolean(template))
  const templates = laneTemplates.length
    ? laneTemplates
    : Object.values(overlay.modelTemplates).filter((template): template is BurstModelTemplate => Boolean(template))

  if (templates.length === 0) return null

  const modelIndex = overlay.nextModelIndexByLane[lane.id] ?? 0
  overlay.nextModelIndexByLane[lane.id] = modelIndex + 1

  return templates[modelIndex % templates.length]
}

function createNoteObject(
  THREE: ThreeModule,
  overlay: OverlayScene,
  lane: MusicBurstLaneConfig,
  intensity: number,
) {
  const group = new THREE.Group()
  const modelTemplate = getNextModelTemplate(overlay, lane)
  const model = modelTemplate?.template.clone(true)

  if (model && modelTemplate) {
    if (modelTemplate.id === 'drum') {
      model.rotation.set(0, 0, 0)
    } else {
      model.rotation.set(-0.1, 0.24, -0.16)
    }
    group.add(model)

    return { group, materials: [], modelId: modelTemplate.id }
  }

  const material = createBurstMaterial(THREE, intensity)
  const noteHead = new THREE.Mesh(overlay.noteGeometry, material)
  const stem = new THREE.Mesh(overlay.stemGeometry, material)
  const flag = new THREE.Mesh(overlay.flagGeometry, material)

  noteHead.scale.set(1, 0.74, 0.68)
  noteHead.rotation.z = -0.36
  stem.position.set(0.07, 0.22, 0.01)
  flag.position.set(0.07, 0.39, -0.008)

  group.add(noteHead, stem, flag)

  return { group, materials: [material], modelId: undefined }
}

function createNoteParticle(
  THREE: ThreeModule,
  overlay: OverlayScene,
  point: { x: number; y: number },
  intensity: number,
  settings: MusicNoteBurstSettings,
  lane: MusicBurstLaneConfig,
) {
  const { width, height } = overlay
  const aspect = width / Math.max(height, 1)
  const viewHeight = 5.1
  const viewWidth = viewHeight * aspect
  const worldX = (point.x / Math.max(width, 1) - 0.5) * viewWidth
  const worldY = -(point.y / Math.max(height, 1) - 0.5) * viewHeight
  const laneJitterX = randomBetween(-lane.spreadX, lane.spreadX)
  const laneJitterY = randomBetween(-lane.spreadY, lane.spreadY)
  const targetWorldX = (lane.x + laneJitterX - 0.5) * viewWidth
  const targetWorldY = -(lane.y + laneJitterY - 0.5) * viewHeight

  const { group, materials, modelId } = createNoteObject(THREE, overlay, lane, intensity)
  const isDrum = modelId === 'drum'

  group.position.set(
    worldX,
    worldY,
    randomBetween(-1.45, -0.75),
  )
  if (isDrum) {
    group.rotation.set(
      0,
      0,
      randomBetween(-0.18, 0.18),
    )
  } else {
    group.rotation.set(
      randomBetween(-1.05, 1.05),
      randomBetween(-1.35, 1.35),
      randomBetween(-0.95, 0.95),
    )
  }

  const depthTravel = (randomBetween(1.65, 2.35) + intensity * randomBetween(0.18, 0.35)) * lane.depth
  const particle: NoteParticle = {
    group,
    materials,
    modelId,
    start: group.position.clone(),
    velocity: new THREE.Vector3(
      targetWorldX - worldX,
      targetWorldY - worldY,
      depthTravel,
    ),
    curve: new THREE.Vector3(
      (lane.curveX + randomBetween(-0.02, 0.02)) * viewWidth,
      -(lane.curveY + randomBetween(-0.02, 0.02)) * viewHeight,
      randomBetween(-0.12, 0.12),
    ),
    spin: new THREE.Vector3(
      isDrum ? 0 : (randomBetween(-1.3, 1.3) + randomBetween(-0.7, 0.7) * intensity) * lane.spin,
      isDrum ? 0 : (randomBetween(-2.1, 2.1) + randomBetween(-1, 1) * intensity) * lane.spin,
      isDrum ? randomBetween(-0.18, 0.18) * lane.spin : (randomBetween(-1.8, 1.8) + randomBetween(-1.3, 1.3) * intensity) * lane.spin,
    ),
    bornAt: performance.now(),
    lifeMs: ((randomBetween(980, 1240) + intensity * randomBetween(90, 190)) * settings.duration) / (settings.speed * lane.speed),
    baseScale: (BASE_PARTICLE_SCALE + intensity * 0.04) * settings.size * lane.scale,
    lift: randomBetween(-0.08, 0.1) + intensity * randomBetween(-0.05, 0.05) + lane.lift,
    drift: randomBetween(0.9, 2.4) + intensity * 0.7,
  }

  group.scale.setScalar(particle.baseScale * 0.4)
  overlay.scene.add(group)
  overlay.particles.push(particle)
}

function resizeOverlay(overlay: OverlayScene, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect()
  overlay.width = Math.max(1, rect.width)
  overlay.height = Math.max(1, rect.height)
  overlay.camera.aspect = overlay.width / overlay.height
  overlay.camera.updateProjectionMatrix()
  overlay.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  overlay.renderer.setSize(overlay.width, overlay.height, false)
}

function updateParticle(particle: NoteParticle, now: number, deltaSeconds: number) {
  const progress = Math.min(1, (now - particle.bornAt) / particle.lifeMs)
  const moveProgress = easeOutCubic(progress)
  const arc = Math.sin(progress * Math.PI) * particle.lift
  const laneCurve = Math.sin(progress * Math.PI)

  particle.group.position.set(
    particle.start.x + particle.velocity.x * moveProgress + particle.curve.x * laneCurve,
    particle.start.y + particle.velocity.y * moveProgress + particle.curve.y * laneCurve + arc,
    particle.start.z + particle.velocity.z * moveProgress + particle.curve.z * laneCurve + Math.sin(progress * particle.drift) * 0.06,
  )
  particle.group.rotation.x += particle.spin.x * deltaSeconds
  particle.group.rotation.y += particle.spin.y * deltaSeconds
  particle.group.rotation.z += particle.spin.z * deltaSeconds

  const depthGrow = 0.36 + moveProgress * 0.72
  const pop = Math.sin(progress * Math.PI) * 0.06
  const scale = particle.baseScale * (depthGrow + pop)
  particle.group.scale.setScalar(scale)
}

const MusicNotesOverlay = forwardRef<MusicNotesOverlayHandle, Props>(function MusicNotesOverlay(
  { className, lanes, settings },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<OverlayScene | null>(null)
  const normalizedLanes = useMemo(() => normalizeLaneConfig(lanes), [lanes])
  const normalizedLanesRef = useRef(normalizedLanes)

  useImperativeHandle(ref, () => ({
    burst(point, options) {
      const overlay = overlayRef.current
      if (!overlay) return

      const intensity = clamp01(options?.intensity ?? 0)
      const burstSettings = normalizeSettings(settings)
      const fastExtra = intensity * Math.max(0.75, burstSettings.amount * 0.45 + 1.2)
      const count = Math.round(clamp(burstSettings.amount + fastExtra + randomBetween(-0.25, 0.2), 1, 10))
      const laneSequence = getBurstLaneSequence(overlay, count, options?.laneId)

      if (laneSequence.length === 0) return

      clearPendingBurstTimers(overlay)

      const emitParticle = (lane: MusicBurstLaneConfig) => {
        trimParticleQueue(overlay)
        createNoteParticle(overlay.three, overlay, point, intensity, burstSettings, lane)
      }

      if (!options?.stagger || options.laneId) {
        laneSequence.forEach(emitParticle)
        return
      }

      const laneStaggerMs = Math.max(0, options.laneStaggerMs ?? DEFAULT_LANE_STAGGER_MS)
      laneSequence.forEach((lane, index) => {
        const timer = window.setTimeout(() => {
          overlay.pendingBurstTimers = overlay.pendingBurstTimers.filter((pendingTimer) => pendingTimer !== timer)
          emitParticle(lane)
        }, index * laneStaggerMs)

        overlay.pendingBurstTimers.push(timer)
      })
    },
  }), [settings])

  useEffect(() => {
    normalizedLanesRef.current = normalizedLanes
    if (!overlayRef.current) return
    overlayRef.current.lanes = normalizedLanes
  }, [normalizedLanes])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let disposed = false
    let cleanupScene: (() => void) | null = null

    void import('three').then((THREE) => {
      if (disposed) return

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100)
      camera.position.set(0, 0, 7)

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        canvas,
        premultipliedAlpha: false,
      })
      renderer.setClearColor(0x000000, 0)
      renderer.outputColorSpace = THREE.SRGBColorSpace

      const noteGeometry = new THREE.SphereGeometry(0.14, 24, 16)
      const stemGeometry = new THREE.CylinderGeometry(0.014, 0.014, 0.48, 12)
      const flagGeometry = createFlagGeometry(THREE)

      scene.add(new THREE.AmbientLight('#ffd6ef', 1.6))

      const keyLight = new THREE.DirectionalLight('#ffffff', 2.2)
      keyLight.position.set(2.4, 3.2, 4)
      scene.add(keyLight)

      const rimLight = new THREE.PointLight('#ff9ad7', 4.5, 10)
      rimLight.position.set(-2.5, -1.5, 3)
      scene.add(rimLight)

      const overlay: OverlayScene = {
        three: THREE,
        scene,
        camera,
        renderer,
        particles: [],
        modelTemplates: {},
        lanes: normalizedLanesRef.current,
        nextTemplateIndex: 0,
        nextLaneIndex: 0,
        nextModelIndexByLane: {},
        pendingBurstTimers: [],
        noteGeometry,
        stemGeometry,
        flagGeometry,
        width: 1,
        height: 1,
        rafId: null,
        lastFrameAt: performance.now(),
      }
      overlayRef.current = overlay
      resizeOverlay(overlay, canvas)

      void Promise.all([
        import('three/examples/jsm/loaders/GLTFLoader.js'),
        import('three/examples/jsm/libs/meshopt_decoder.module.js'),
      ]).then(([{ GLTFLoader }, { MeshoptDecoder }]) => {
        if (disposed) return

        const loader = new GLTFLoader()
        loader.setMeshoptDecoder(MeshoptDecoder)
        const textureLoader = new THREE.TextureLoader()
        const modelLoads = MUSIC_BURST_MODEL_SPECS.map(async (spec) => {
          const [object, textures] = await Promise.all([
            new Promise<Group | null>((resolve) => {
              loader.load(
                spec.path,
                (gltf) => resolve(gltf.scene),
                undefined,
                () => resolve(null),
              )
            }),
            loadTextureMaps(THREE, textureLoader, spec.textures),
          ])

          if (!object) return null

          repairMusicModel(spec.id, object)
          applyTexturedMaterial(THREE, object, textures, spec.id)

          return {
            id: spec.id,
            template: prepareModelTemplate(THREE, object),
          }
        })

        void Promise.all(modelLoads).then((templates) => {
          if (disposed) {
            templates.forEach((template) => {
              disposeModelObject(template?.template ?? null)
            })
            return
          }
          overlay.modelTemplates = templates.reduce<Partial<Record<MusicModelId, BurstModelTemplate>>>((modelTemplates, template) => {
            if (template) modelTemplates[template.id] = template
            return modelTemplates
          }, {})
        })
      })

      const resizeObserver = new ResizeObserver(() => {
        resizeOverlay(overlay, canvas)
      })
      resizeObserver.observe(canvas)

      const animate = (now: number) => {
        const deltaSeconds = Math.min(0.05, (now - overlay.lastFrameAt) / 1000)
        overlay.lastFrameAt = now

        for (let i = overlay.particles.length - 1; i >= 0; i -= 1) {
          const particle = overlay.particles[i]
          updateParticle(particle, now, deltaSeconds)

          if (now - particle.bornAt >= particle.lifeMs) {
            overlay.scene.remove(particle.group)
            disposeParticleMaterials(particle)
            overlay.particles.splice(i, 1)
          }
        }

        overlay.renderer.render(overlay.scene, overlay.camera)
        overlay.rafId = requestAnimationFrame(animate)
      }
      overlay.rafId = requestAnimationFrame(animate)

      cleanupScene = () => {
        clearPendingBurstTimers(overlay)
        resizeObserver.disconnect()
        if (overlay.rafId !== null) cancelAnimationFrame(overlay.rafId)
        overlay.particles.forEach((particle) => {
          overlay.scene.remove(particle.group)
          disposeParticleMaterials(particle)
        })
        Object.values(overlay.modelTemplates).forEach((modelTemplate) => disposeModelObject(modelTemplate?.template ?? null))
        noteGeometry.dispose()
        stemGeometry.dispose()
        flagGeometry.dispose()
        renderer.dispose()
        overlayRef.current = null
      }
    })

    return () => {
      disposed = true
      cleanupScene?.()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
    />
  )
})

export default MusicNotesOverlay
