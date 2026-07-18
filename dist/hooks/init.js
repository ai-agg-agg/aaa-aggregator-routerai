import { registry } from '@ai-agg-agg/aaa-sdk';
import { RouterAIAggregator } from '../routerai';
const hook = async function () {
    registry.registerAggregator(new RouterAIAggregator());
};
export default hook;
