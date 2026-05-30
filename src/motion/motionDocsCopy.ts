export type Locale = 'pt' | 'en'

type DemoCopy = {
  title: string
  subtitle?: string
  description: string
}

type DemoLike = {
  id: string
  title: string
  subtitle: string
  description: string
}

export const motionDocsCopy = {
  pt: {
    loading: 'Carregando motion system spec...',
    loadError: 'Falha ao carregar motion-system.json',
    nav: [
      { href: '#system', label: 'Regras do sistema' },
      { href: '#demos', label: 'Demos de motion' },
      { href: '#state-machine', label: 'State machine' },
      { href: '#burst', label: 'Burst lanes' },
    ],
    header: {
      eyebrow: 'Sistema de motion',
      title: 'Referência de handoff para desenvolvimento',
      summary: (version: string, width: number, height: number, fps: number, total: number) =>
        `Spec v${version} | ${width}x${height} @ ${fps}fps | ${total} demos. Esta página documenta motion specs reutilizáveis, regras de state machine em produção e o sistema de burst lanes pela perspectiva de motion design.`,
      burstSandbox: 'Burst sandbox',
      modelSandbox: 'Model sandbox',
    },
    system: {
      eyebrow: 'Fundamentos',
      title: 'Regras do sistema antes das animações individuais',
      intro: 'A página segue a estrutura esperada em um handoff para devs: propósito, token, trigger, state, asset, caminho de acessibilidade e critérios de QA.',
      tokenBands: 'Faixas de duração',
    },
    demos: {
      eyebrow: 'Spec demos',
      title: 'Exemplos reutilizáveis de motion',
      intro: 'Cada demo continua conectada ao JSON spec para que durações, easing curves e keyframes possam virar artefatos exportáveis depois.',
      groups: {
        rule: 'Regras',
        antipattern: 'Anti-patterns',
        sequence: 'Sequências',
      },
    },
    demoCard: {
      replay: 'Repetir',
      interactiveExample: 'Exemplo interativo',
      rule: 'Regra',
      avoid: 'Evitar',
      bezierCurve: 'Curva Bezier',
    },
    radioDemo: {
      title: 'Shows salvos',
      subtitle: 'Eventos que você não quer perder',
    },
    stateMachine: {
      eyebrow: 'Lógica de interação',
      title: 'Regra de state machine para a ilustração de conclusão',
      intent: 'Manter a ilustração de conclusão divertida sem deixar o sistema não determinístico: um clipe ativo, um clipe pendente, janelas de toque claras e sem burst spam empilhado.',
      stateFlow: 'Fluxo de estados',
      transitionTable: 'Tabela de transições',
      columns: ['Evento', 'De', 'Para', 'Guard', 'Action'],
      states: [
        { label: 'Dança inicial', detail: 'No mount, toca conclusao-dance.' },
        { label: 'Idle loop', detail: 'O clipe idle base fica em loop no AlphaVideo quando não existe clipe pendente.' },
        { label: 'Dança pendente', detail: 'O segundo toque coloca conclusao-dance na fila.' },
        { label: 'Personagem pendente', detail: 'O terceiro toque, ou qualquer toque depois dele, substitui o clipe pendente pelo próximo character cameo.' },
        { label: 'Clipe especial em execução', detail: 'Qualquer clipe de dança ou personagem toca uma vez, volta para idle e só então consome o próximo item pendente.' },
      ],
      transitions: [
        {
          event: 'MOUNT',
          from: 'none',
          to: 'Dança inicial',
          guard: 'Sempre na entrada da rota',
          action: 'setCurrentVideo(conclusao-dance)',
        },
        {
          event: 'VIDEO_ENDED',
          from: 'Clipe especial em execução',
          to: 'Idle loop',
          guard: 'currentVideo !== idle',
          action: 'setCurrentVideo(idle), reset tap accumulator',
        },
        {
          event: 'VIDEO_ENDED',
          from: 'Idle loop',
          to: 'Clipe especial em execução',
          guard: 'pendingVideoRef tem um clipe na fila',
          action: 'consume pendingVideoRef and play it once',
        },
        {
          event: 'SECOND_TAP',
          from: 'Idle loop ou clipe especial em execução',
          to: 'Dança pendente',
          guard: 'Intervalo entre taps <= 560ms',
          action: 'queueDance(); burst(origin, intensity 0.86, stagger 52ms)',
        },
        {
          event: 'THIRD_TAP_PLUS',
          from: 'Dança pendente',
          to: 'Personagem pendente',
          guard: 'Mesma janela de gesture; character queue tem opções',
          action: 'queueNextCharacter(); do not fire full burst again',
        },
      ],
      guardrails: [
        'O feedback visual do tap é imediato e independente do state do vídeo.',
        'O burst 3D completo dispara apenas no segundo tap de um gesture novo.',
        'Um clipe especial nunca é interrompido por um clipe pendente; a fila é consumida a partir do idle.',
        'A ordem dos character cameos é embaralhada e evita repetir o primeiro cameo anterior quando possível.',
      ],
    },
    burst: {
      eyebrow: 'Camada expressiva',
      title: 'Lógica de burst e mapa de lanes',
      intro: 'A documentação usa a mesma matemática de lane-map do sandbox, então o handoff descreve o sistema visual de lanes e o algoritmo de produção com os mesmos valores.',
      productionMap: 'Mapa de lanes em produção',
      productionSubtitle: '12 saídas, round-robin',
      selectedLane: 'Lane selecionada',
      enabled: 'Ativa',
      disabled: 'Inativa',
      modelCycle: 'Ciclo de modelos',
      contract: 'Contrato do burst',
      trigger: 'MusicNotesOverlay.burst(point, { intensity, stagger, laneStaggerMs, laneId })',
      algorithmNotes: 'Notas de algoritmo',
      laneInventory: 'Inventário de lanes',
      laneInventorySummary: (lanes: number, families: number) =>
        `${lanes} lanes alternam entre ${families} famílias de modelos FBX. Cada lane começa com um offset diferente de modelo para que bursts repetidos não pareçam um anel clonado.`,
      on: 'On',
      off: 'Off',
      constants: [
        { label: 'Janela de gesture', detail: '560ms entre taps para o caminho de burst especial.' },
        { label: 'Intensidade em produção', detail: '0.86 para o burst especial da conclusão.' },
        { label: 'Stagger entre lanes', detail: '52ms entre lanes quando o burst completo é escalonado.' },
        { label: 'Limite de partículas', detail: '34 partículas vivas; as mais antigas são descartadas antes de criar novas.' },
      ],
      algorithm: [
        'Normalizar amount, size, speed e duration dentro de faixas limitadas.',
        'Converter intensity em partículas extras e limitar o total entre 1 e 10.',
        'Selecionar lanes ativas em round-robin, exceto quando um laneId específico for solicitado.',
        'Escolher modelos da lista da lane selecionada, também em round-robin por lane.',
        'Converter a origem em screen-space e o target da lane para coordenadas de mundo do Three.js.',
        'Aplicar curve, spread, depth, lift, speed, scale e spin da lane durante a criação das partículas.',
        'Usar progresso cubic ease-out, arco em seno e crescimento de profundidade para os objetos saírem rápido e assentarem naturalmente.',
      ],
    },
  },
  en: {
    loading: 'Loading motion system spec...',
    loadError: 'Failed to load motion-system.json',
    nav: [
      { href: '#system', label: 'System rules' },
      { href: '#demos', label: 'Motion demos' },
      { href: '#state-machine', label: 'State machine' },
      { href: '#burst', label: 'Burst lanes' },
    ],
    header: {
      eyebrow: 'Motion design system',
      title: 'Developer handoff reference',
      summary: (version: string, width: number, height: number, fps: number, total: number) =>
        `Spec v${version} | ${width}x${height} @ ${fps}fps | ${total} demos. This page documents reusable motion specs, production state-machine rules, and the burst lane system from a motion designer perspective.`,
      burstSandbox: 'Burst sandbox',
      modelSandbox: 'Model sandbox',
    },
    system: {
      eyebrow: 'Foundations',
      title: 'System rules before individual animations',
      intro: 'The page follows the same structure expected in a developer handoff: purpose, token, trigger, state, asset, accessibility path, and QA criteria.',
      tokenBands: 'Token bands',
    },
    demos: {
      eyebrow: 'Spec demos',
      title: 'Reusable motion examples',
      intro: 'Each demo remains connected to the JSON spec so durations, easing curves, and keyframes can become exportable artifacts later.',
      groups: {
        rule: 'Rules',
        antipattern: 'Anti-patterns',
        sequence: 'Sequences',
      },
    },
    demoCard: {
      replay: 'Replay',
      interactiveExample: 'Interactive example',
      rule: 'Rule',
      avoid: 'Avoid',
      bezierCurve: 'Bezier curve',
    },
    radioDemo: {
      title: 'Saved shows',
      subtitle: 'Events you do not want to miss',
    },
    stateMachine: {
      eyebrow: 'Interaction logic',
      title: 'State machine rule for the conclusion illustration',
      intent: 'Keep the conclusion illustration playful without making the system nondeterministic: one active clip, one pending clip, clear tap windows, and no stacked burst spam.',
      stateFlow: 'State flow',
      transitionTable: 'Transition table',
      columns: ['Event', 'From', 'To', 'Guard', 'Action'],
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
      ],
      guardrails: [
        'Visual tap feedback is immediate and independent from the video state.',
        'The full 3D burst fires only on the second tap in a fresh gesture.',
        'A feature clip is never interrupted by the pending clip; pending work is consumed from idle.',
        'Character cameo order is shuffled and avoids repeating the previous first cameo when possible.',
      ],
    },
    burst: {
      eyebrow: 'Expressive layer',
      title: 'Burst logic and lane map',
      intro: 'The docs use the same lane-map math as the sandbox, so the handoff can describe the visual lane system and the production algorithm with matching values.',
      productionMap: 'Production lane map',
      productionSubtitle: '12 exits, round-robin',
      selectedLane: 'Selected lane',
      enabled: 'Enabled',
      disabled: 'Disabled',
      modelCycle: 'Model cycle',
      contract: 'Burst contract',
      trigger: 'MusicNotesOverlay.burst(point, { intensity, stagger, laneStaggerMs, laneId })',
      algorithmNotes: 'Algorithm notes',
      laneInventory: 'Lane inventory',
      laneInventorySummary: (lanes: number, families: number) =>
        `${lanes} lanes rotate through ${families} FBX model families. Each lane starts with a different model offset so repeated bursts do not feel like a cloned ring.`,
      on: 'On',
      off: 'Off',
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
    },
  },
} as const

const demoCopyPt: Record<string, DemoCopy> = {
  'tap-button': {
    title: 'Feedback de toque: botão',
    subtitle: '150ms | ease-out | escala 0.96',
    description: 'Botões e icon buttons reduzem para escala 0.96 no press. O feedback deve ser rápido, responsivo e imediato. Use em CTAs primários e secundários, controles de ícone e FABs.',
  },
  'press-card-standard': {
    title: 'Feedback de press: card padrão',
    subtitle: '200ms | ease-out | escala 0.985',
    description: 'Cards padrão usam uma escala de press mais sutil que botões. Use para event cards, list items e radio cards não selecionados.',
  },
  'press-card-selected': {
    title: 'Feedback de press: card selecionado',
    subtitle: '200ms | ease-out | escala 0.99',
    description: 'Cards selecionados já têm ênfase visual, então o press feedback precisa ser ainda menor. Use para radio cards selecionados.',
  },
  'reveal-popup': {
    title: 'Reveal: ênfase em popup',
    subtitle: '200ms | ease-out | y:32->0, escala 0.98->1, opacity 0->1',
    description: 'Use para entrada do FansPill, ênfase em card selecionado e conteúdo de popup ou sheet. O elemento entra suavemente com uma pequena translação para cima.',
  },
  'container-transition': {
    title: 'Transição de container: página ou modal',
    subtitle: '300ms | spring curve | x:48->0, opacity 0->1',
    description: 'Use em page transitions e entrada ou saída de modais. A spring curve (0.22, 1, 0.36, 1) é o único easing com leve overshoot. Use apenas em containers, nunca em controles interativos.',
  },
  'hero-lottie': {
    title: 'Momento hero: entrada da ilustração',
    subtitle: '800ms | ease-out | escala 0.7->1.05->1, opacity 0->1',
    description: 'Reserve este motion mais longo para ilustrações Lottie expressivas. Ele carrega peso emocional, semelhante a um map fly-to em um app baseado em localização.',
  },
  'anti-easeinout': {
    title: 'Anti-pattern: ease-in-out em controle interativo',
    subtitle: 'Parece lento no começo e pesado no final',
    description: 'Uma rampa simétrica faz o tap feedback parecer macio e atrasado. Use ease-out para feedback visual de UI.',
  },
  'anti-scale-aggressive': {
    title: 'Anti-pattern: escala 0.94 em cards',
    subtitle: 'Agressivo demais para uma interface premium',
    description: 'Qualquer valor abaixo de 0.96 para botões ou 0.97 para cards fica pesado demais. Motion premium deve parecer contido.',
  },
  'anti-no-duration': {
    title: 'Anti-pattern: transition-colors sem duração explícita',
    subtitle: 'Cai no timing e curva padrão errados',
    description: 'Tailwind transition-colors sem duration usa o padrão 150ms ease-in-out. Sempre defina duração e easing.',
  },
  'anti-spring-on-button': {
    title: 'Anti-pattern: spring curve em controle interativo',
    subtitle: 'Overshoot faz o tap feedback parecer instável',
    description: 'A spring curve é apenas para containers. Em botões, ela faz o press feedback parecer instável em vez de responsivo.',
  },
  'sequence-list-stagger': {
    title: 'List stagger: entrada de cards',
    subtitle: '5 cards | stagger 50ms | delay 100ms | cada card usa 200ms ease-out',
    description: 'Listas de event cards entram como cascata no mount. Isto é uma sequência, não um burst: o stagger cria uma ordem clara de leitura.',
  },
  'sequence-radio-select': {
    title: 'Radio selection: mudança de state',
    subtitle: 'Morph de background 200ms + dot fill 200ms, sincronizados',
    description: 'Use para seleção em radio-card. Duas coisas mudam juntas: o background do card e o preenchimento do ponto interno. Ambas usam 200ms ease-out e disparam pelo mesmo handler.',
  },
  'sequence-conclusion-hero': {
    title: 'Conclusion hero: entrada coreografada',
    subtitle: 'Ilustração hero 800ms + reveal do título 200ms com delay de 400ms',
    description: 'Na tela de conclusão, a animação hero roda por 800ms. O reveal do título começa 400ms depois do início do hero, não depois que ele termina. Trate como um motion dominante com uma camada de apoio.',
  },
  'sequence-card-detail-flip': {
    title: 'Card para detalhe: FLIP medido com duas faces',
    subtitle: 'Geometry shell + source face + destination face',
    description: 'Use este padrão quando o card de origem e a tela de destino não compartilham a mesma estrutura visual. O shell externo controla apenas a geometria medida: x, y, width, height e borderRadius do card rect até o viewport do PhoneFrame. Dentro do shell, duas faces absolutas inset-0 fazem a troca visual: source card face e destination screen face. Isso evita distorção de texto e ícones, remove o estado intermediário branco e mantém a volta contínua. Não misture este padrão com layoutId no mesmo morph. Regras de implementação: medir depois de liberar o PhoneFrame chrome com flushSync; manter o card real escondido com visibility:hidden até onExitComplete; deixar o overlay desenhar sua própria source face durante o close; manter o shell responsável só por geometria; usar um único dono de shadow por fase, sem empilhar shadow no shell, source e card.',
  },
  'anti-mixed-morph-ownership': {
    title: 'Anti-pattern: misturar layoutId, FLIP e crossfade corretivo',
    subtitle: 'Três donos para uma transição criam comportamento frágil',
    description: 'Evite usar layoutId, medição manual de FLIP e crossfade corretivo para resolver o mesmo morph. layoutId espera que o Framer Motion controle a medição. FLIP manual espera que o app controle a medição. Crossfade corretivo esconde diferenças visuais depois do fato. Misturar os três cria projeções desatualizadas, medidas erradas quando o chrome muda, flashes brancos, shadows duplicadas e handoffs frágeis. Escolha um modelo principal para cada transição.',
  },
}

export function localizeDemo<T extends DemoLike>(demo: T, locale: Locale): T {
  if (locale === 'en') return demo

  const copy = demoCopyPt[demo.id]
  if (!copy) return demo

  return {
    ...demo,
    title: copy.title,
    subtitle: copy.subtitle ?? demo.subtitle,
    description: copy.description,
  }
}
