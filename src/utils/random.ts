export function pickRandom<T>(items: readonly T[], previous?: T | null): T {
  const pool = previous && items.length > 1
    ? items.filter((item) => item !== previous)
    : items

  return pool[Math.floor(Math.random() * pool.length)]
}
