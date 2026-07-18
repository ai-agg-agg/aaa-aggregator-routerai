import { Hook } from '@oclif/core'
import { registry } from '@ai-agg-agg/aaa-sdk'
import { RouterAIAggregator } from '../routerai'

const hook: Hook<'init'> = async function () {
  registry.registerAggregator(new RouterAIAggregator())
}

export default hook
