import { Hook } from '@oclif/core'
import { registry } from 'aaa'
import { RouterAIAggregator } from '../routerai'

const hook: Hook<'init'> = async function () {
  registry.registerAggregator(new RouterAIAggregator())
}

export default hook
