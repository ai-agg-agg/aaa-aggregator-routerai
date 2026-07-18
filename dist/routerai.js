import { httpGet, cacheSet, cacheGet, cacheStaleGet, isCacheFresh, resolveAuth } from '@ai-agg-agg/aaa-sdk';
const CACHE_KEY = 'routerai/models';
export class RouterAIAggregator {
    name = 'routerai';
    apiBase;
    constructor() {
        this.apiBase = process.env.ROUTERAI_API_BASE ?? 'https://routerai.ru/api';
    }
    async auth() {
        return resolveAuth(this.name, 'ROUTERAI_API_KEY', `${Bun.env.HOME ?? '~'}/.authinfo.gpg`);
    }
    async fetchModels() {
        if (await isCacheFresh(CACHE_KEY)) {
            const cached = await cacheGet(CACHE_KEY);
            if (cached)
                return JSON.parse(cached);
        }
        try {
            let body;
            try {
                body = await httpGet(`${this.apiBase}/v1/models`);
            }
            catch {
                const token = await this.auth();
                body = await httpGet(`${this.apiBase}/v1/models`, { headers: { Authorization: `Bearer ${token}` } });
            }
            const raw = JSON.parse(body);
            const items = raw.data ?? raw;
            const models = items.map((item) => {
                const pricing = item.pricing;
                const perRequestLimits = item.per_request_limits;
                const promptPerMillion = Math.round(((pricing?.prompt ?? 0)) * 1_000_000 * 100) / 100;
                const completionPerMillion = Math.round(((pricing?.completion ?? 0)) * 1_000_000 * 100) / 100;
                return {
                    id: item.id,
                    providers: [],
                    top_provider: {
                        name: '?',
                        context_length: item.context_length ?? 0,
                        max_completion_tokens: perRequestLimits?.max_tokens ?? 0,
                        pricing: {
                            prompt_per_million: promptPerMillion,
                            completion_per_million: completionPerMillion,
                            currency: 'RUB',
                        },
                    },
                    _aggregator: 'routerai.ru',
                };
            });
            await cacheSet(CACHE_KEY, JSON.stringify(models));
            return models;
        }
        catch {
            const stale = await cacheStaleGet(CACHE_KEY);
            if (stale)
                return JSON.parse(stale);
            throw new Error('Failed to fetch RouterAI models');
        }
    }
    async getBalance() {
        const token = await this.auth();
        const body = await httpGet(`${this.apiBase}/v1/key`, { headers: { Authorization: `Bearer ${token}` } });
        const data = JSON.parse(body);
        const inner = data.data;
        return parseFloat(String(data.balance ?? inner?.balance ?? '0'));
    }
    async getUsage() {
        return '0';
    }
    filterModels(models, agentType) {
        if (agentType === 'any')
            return models;
        const regex = agentType === 'claude' ? /claude|anthropic/i : /openai|azure|gpt/i;
        return models.filter(m => m.providers.some(p => regex.test(p.name)) || regex.test(m.id));
    }
}
