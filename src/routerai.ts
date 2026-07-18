import type { Aggregator, Model, AgentType } from 'aaa'
import { httpGet, cacheSet, cacheGet, cacheStaleGet, isCacheFresh, resolveAuth } from 'aaa'

const CACHE_KEY = 'routerai/models'

export class RouterAIAggregator implements Aggregator {
  readonly name = 'routerai'
  readonly apiBase: string

  constructor() {
    this.apiBase = process.env.ROUTERAI_API_BASE ?? 'https://routerai.ru/api'
  }

  async auth(): Promise<string> {
    return resolveAuth(this.name, 'ROUTERAI_API_KEY', `${Bun.env.HOME ?? '~'}/.authinfo.gpg`)
  }

  async fetchModels(): Promise<Model[]> {
    if (await isCacheFresh(CACHE_KEY)) {
      const cached = await cacheGet(CACHE_KEY)
      if (cached) return JSON.parse(cached) as Model[]
    }

    try {
      let body: string
      try {
        body = await httpGet(`${this.apiBase}/v1/models`)
      } catch {
        const token = await this.auth()
        body = await httpGet(
          `${this.apiBase}/v1/models`,
          { headers: { Authorization: `Bearer ${token}` } },
        )
      }

      const raw = JSON.parse(body)
      const items = raw.data ?? raw as unknown[]

      const models: Model[] = (items as Array<Record<string, unknown>>).map((item: Record<string, unknown>) => {
        const pricing = item.pricing as Record<string, number> | undefined
        const perRequestLimits = item.per_request_limits as Record<string, number> | undefined
        const promptPerMillion = Math.round(((pricing?.prompt ?? 0)) * 1_000_000 * 100) / 100
        const completionPerMillion = Math.round(((pricing?.completion ?? 0)) * 1_000_000 * 100) / 100
        return {
          id: item.id as string,
          providers: [],
          top_provider: {
            name: '?',
            context_length: (item.context_length as number) ?? 0,
            max_completion_tokens: perRequestLimits?.max_tokens ?? 0,
            pricing: {
              prompt_per_million: promptPerMillion,
              completion_per_million: completionPerMillion,
              currency: 'RUB',
            },
          },
          _aggregator: 'routerai.ru' as string | undefined,
        }
      })

      await cacheSet(CACHE_KEY, JSON.stringify(models))
      return models
    } catch {
      const stale = await cacheStaleGet(CACHE_KEY)
      if (stale) return JSON.parse(stale) as Model[]
      throw new Error('Failed to fetch RouterAI models')
    }
  }

  async getBalance(): Promise<number> {
    const token = await this.auth()
    const body = await httpGet(
      `${this.apiBase}/v1/key`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    const data = JSON.parse(body) as Record<string, unknown>
    const inner = data.data as Record<string, unknown> | undefined
    return parseFloat(String(data.balance ?? inner?.balance ?? '0'))
  }

  async getUsage(): Promise<string> {
    return '0'
  }

  filterModels(models: Model[], agentType: AgentType): Model[] {
    if (agentType === 'any') return models
    const regex = agentType === 'claude' ? /claude|anthropic/i : /openai|azure|gpt/i
    return models.filter(m =>
      m.providers.some(p => regex.test(p.name)) || regex.test(m.id),
    )
  }
}
