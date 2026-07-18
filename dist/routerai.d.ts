import type { Aggregator, Model, AgentType } from '@ai-agg-agg/aaa-sdk';
export declare class RouterAIAggregator implements Aggregator {
    readonly name = "routerai";
    readonly apiBase: string;
    constructor();
    auth(): Promise<string>;
    fetchModels(): Promise<Model[]>;
    getBalance(): Promise<number>;
    getUsage(): Promise<string>;
    filterModels(models: Model[], agentType: AgentType): Model[];
}
