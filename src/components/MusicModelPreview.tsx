import { useEffect, useRef } from 'react'
import type {
  BufferGeometry,
  Group,
  Material,
  Mesh,
  Object3D,
  PerspectiveCamera,
  Scene,
  Texture,
  TextureLoader,
  WebGLRenderer,
} from 'three'
import type { BurstModelSpec, BurstTextureSpec } from './musicBurstConfig'
import { repairMusicModel } from './musicModelTransforms'

type ThreeModule = typeof import('three')
type TextureMaps = Partial<Record<keyof BurstTextureSpec, Texture>>

type Props = {
  className?: string
  model: BurstModelSpec
  /** Override the geometry file path. Used by /model-sandbox to swap
   *  between .fbx and versioned .v{N}.glb for visual comparison while
   *  the runtime app keeps loading the canonical .glb. Loader is picked
   *  from the file extension. */
  pathOverride?: string
  /** Spins the model on Y axis at a constant rate. Used by the model
   *  sandbox to inspect texture mapping from all sides. Default off so
   *  the burst lane previews stay static. */
  autoRotate?: boolean
  /** Radians per second when autoRotate is on. */
  rotateSpeed?: number
}

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

function isMesh(object: Object3D): object is Mesh {
  return 'isMesh' in object && (object as Mesh).isMesh
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
  const textures: TextureMaps = {}

  textureEntries.forEach(([textureType, texture]) => {
    if (texture) textures[textureType as keyof BurstTextureSpec] = texture
  })

  return textures
}

function createTexturedMaterial(THREE: ThreeModule, textures: TextureMaps) {
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
    transparent: Boolean(textures.alpha),
  })

  if (textures.normal) material.normalScale.set(0.72, 0.72)

  return material
}

function ensureAmbientOcclusionUv(mesh: Mesh) {
  const uv = mesh.geometry.getAttribute('uv')
  if (uv && !mesh.geometry.getAttribute('uv2')) {
    mesh.geometry.setAttribute('uv2', uv.clone())
  }
}

function preparePreviewModel(THREE: ThreeModule, object: Group, textures: TextureMaps) {
  const material = createTexturedMaterial(THREE, textures)

  object.traverse((child) => {
    if (!isMesh(child)) return
    ensureAmbientOcclusionUv(child)
    child.material = material
  })

  const holder = new THREE.Group()
  holder.add(object)

  const box = new THREE.Box3().setFromObject(object)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  object.position.sub(center)

  const maxDimension = Math.max(size.x, size.y, size.z, 0.001)
  holder.scale.setScalar(1.7 / maxDimension)
  holder.rotation.set(-0.12, 0.45, -0.12)

  return holder
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

function disposeObject(object: Object3D | null) {
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

function resizeRenderer(
  renderer: WebGLRenderer,
  camera: PerspectiveCamera,
  canvas: HTMLCanvasElement,
) {
  const rect = canvas.getBoundingClientRect()
  const width = Math.max(1, rect.width)
  const height = Math.max(1, rect.height)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(width, height, false)
}

function renderPreview(
  renderer: WebGLRenderer | null,
  scene: Scene | null,
  camera: PerspectiveCamera | null,
) {
  if (!renderer || !scene || !camera) return
  renderer.render(scene, camera)
}

export default function MusicModelPreview({ className, model, pathOverride, autoRotate = false, rotateSpeed = 0.8 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let disposed = false
    let renderer: WebGLRenderer | null = null
    let scene: Scene | null = null
    let camera: PerspectiveCamera | null = null
    let previewModel: Group | null = null
    let resizeObserver: ResizeObserver | null = null
    let rafId: number | null = null

    // Drag-to-orbit state. Pointer down on the canvas starts a drag; the
    // RAF tick reads pendingDelta and applies it as a Y (yaw) + X (pitch)
    // rotation on the model holder. Auto-rotate is suspended while
    // dragging so user-driven motion isn't fighting it. Pitch is clamped
    // to ±85° to avoid the gimbal-lock flip-over.
    const DRAG_SENSITIVITY = 0.008
    const PITCH_LIMIT = Math.PI * 0.47
    let dragging = false
    let activePointerId: number | null = null
    let lastClientX = 0
    let lastClientY = 0
    const pendingDelta = { x: 0, y: 0 }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== undefined && event.button !== 0) return
      dragging = true
      activePointerId = event.pointerId
      lastClientX = event.clientX
      lastClientY = event.clientY
      canvas.setPointerCapture(event.pointerId)
      canvas.classList.add('cursor-grabbing')
      canvas.classList.remove('cursor-grab')
    }
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== activePointerId) return
      pendingDelta.x += event.clientX - lastClientX
      pendingDelta.y += event.clientY - lastClientY
      lastClientX = event.clientX
      lastClientY = event.clientY
    }
    const handlePointerEnd = (event: PointerEvent) => {
      if (event.pointerId !== activePointerId) return
      dragging = false
      activePointerId = null
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId)
      }
      canvas.classList.add('cursor-grab')
      canvas.classList.remove('cursor-grabbing')
    }

    // Interactive controls (drag-to-orbit + grab cursor) are only attached
    // when the preview is also auto-rotating. The BurstSandbox renders
    // static thumbnails (autoRotate=false) and shouldn't pay for either
    // pointer handling or a perpetual RAF render loop.
    if (autoRotate) {
      canvas.addEventListener('pointerdown', handlePointerDown)
      canvas.addEventListener('pointermove', handlePointerMove)
      canvas.addEventListener('pointerup', handlePointerEnd)
      canvas.addEventListener('pointercancel', handlePointerEnd)
      canvas.addEventListener('lostpointercapture', handlePointerEnd)
      canvas.classList.add('cursor-grab')
      canvas.style.touchAction = 'none'
    }

    const geometryPath = pathOverride ?? model.path
    const useFbx = geometryPath.toLowerCase().endsWith('.fbx')

    void import('three').then(async (THREE) => {
      if (disposed) return

      const loaderModules = useFbx
        ? await import('three/examples/jsm/loaders/FBXLoader.js').then((m) => ({ kind: 'fbx' as const, FBXLoader: m.FBXLoader }))
        : await Promise.all([
            import('three/examples/jsm/loaders/GLTFLoader.js'),
            import('three/examples/jsm/libs/meshopt_decoder.module.js'),
          ]).then(([gl, md]) => ({ kind: 'gltf' as const, GLTFLoader: gl.GLTFLoader, MeshoptDecoder: md.MeshoptDecoder }))
      if (disposed) return

      scene = new THREE.Scene()
      camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
      camera.position.set(0, 0, 6)

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        canvas,
        premultipliedAlpha: false,
      })
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.setClearColor(0x000000, 0)

      scene.add(new THREE.AmbientLight('#ffd6ef', 1.7))

      const keyLight = new THREE.DirectionalLight('#ffffff', 2.1)
      keyLight.position.set(2.4, 3, 4)
      scene.add(keyLight)

      const rimLight = new THREE.PointLight('#ff9ad7', 3.8, 9)
      rimLight.position.set(-2.2, -1.6, 3)
      scene.add(rimLight)

      resizeObserver = new ResizeObserver(() => {
        if (renderer && camera) {
          resizeRenderer(renderer, camera, canvas)
          renderPreview(renderer, scene, camera)
        }
      })
      resizeObserver.observe(canvas)
      resizeRenderer(renderer, camera, canvas)

      const textureLoader = new THREE.TextureLoader()
      const loadGeometry = new Promise<Group | null>((resolve) => {
        if (loaderModules.kind === 'fbx') {
          const fbxLoader = new loaderModules.FBXLoader()
          fbxLoader.load(geometryPath, (obj) => resolve(obj), undefined, () => resolve(null))
        } else {
          const gltfLoader = new loaderModules.GLTFLoader()
          gltfLoader.setMeshoptDecoder(loaderModules.MeshoptDecoder)
          gltfLoader.load(geometryPath, (gltf) => resolve(gltf.scene), undefined, () => resolve(null))
        }
      })
      const [object, textures] = await Promise.all([
        loadGeometry,
        loadTextureMaps(THREE, textureLoader, model.textures),
      ])

      if (disposed || !object || !scene || !camera || !renderer) {
        disposeObject(object)
        return
      }

      repairMusicModel(model.id, object)
      previewModel = preparePreviewModel(THREE, object, textures)
      scene.add(previewModel)
      renderPreview(renderer, scene, camera)

      if (autoRotate) {
        // RAF loop drives BOTH auto-rotate and drag-to-orbit rendering.
        // Flushed drag deltas are applied each tick and consumed; while
        // the user is dragging, auto-rotate is suspended so the two
        // don't fight each other.
        let lastTime = performance.now()
        const tick = (now: number) => {
          if (disposed || !previewModel || !renderer || !scene || !camera) return
          const deltaSeconds = Math.min(0.05, (now - lastTime) / 1000)
          lastTime = now

          if (pendingDelta.x !== 0 || pendingDelta.y !== 0) {
            previewModel.rotation.y += pendingDelta.x * DRAG_SENSITIVITY
            previewModel.rotation.x += pendingDelta.y * DRAG_SENSITIVITY
            if (previewModel.rotation.x > PITCH_LIMIT) previewModel.rotation.x = PITCH_LIMIT
            if (previewModel.rotation.x < -PITCH_LIMIT) previewModel.rotation.x = -PITCH_LIMIT
            pendingDelta.x = 0
            pendingDelta.y = 0
          } else if (!dragging) {
            previewModel.rotation.y += rotateSpeed * deltaSeconds
          }

          renderer.render(scene, camera)
          rafId = requestAnimationFrame(tick)
        }
        rafId = requestAnimationFrame(tick)
      }
    })

    return () => {
      disposed = true
      if (rafId !== null) cancelAnimationFrame(rafId)
      if (autoRotate) {
        canvas.removeEventListener('pointerdown', handlePointerDown)
        canvas.removeEventListener('pointermove', handlePointerMove)
        canvas.removeEventListener('pointerup', handlePointerEnd)
        canvas.removeEventListener('pointercancel', handlePointerEnd)
        canvas.removeEventListener('lostpointercapture', handlePointerEnd)
        canvas.classList.remove('cursor-grab', 'cursor-grabbing')
        canvas.style.touchAction = ''
      }
      resizeObserver?.disconnect()
      if (scene && previewModel) scene.remove(previewModel)
      disposeObject(previewModel)
      renderer?.dispose()
    }
  }, [model, pathOverride, autoRotate, rotateSpeed])

  return (
    <canvas
      ref={canvasRef}
      aria-label={`${model.label} preview`}
      className={className}
    />
  )
}
