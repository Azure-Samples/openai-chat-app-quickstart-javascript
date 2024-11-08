import fastifyStatic from '@fastify/static'
import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import path from 'path'
import { fileURLToPath } from 'url'
import { chatRoute } from './openai-chat-api.js'

// Define __dirname in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fastify = Fastify({
  logger: true
})

const publicPath = path.join(__dirname, 'public')

// Register the fastify-static plugin
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/public',
})

const routes = (fastify: FastifyInstance, _: any, done: () => void) => {

  fastify.post('/chat/stream', chatRoute);

  fastify.get('/', (_: FastifyRequest, reply: FastifyReply) => {
    reply.sendFile('index.html')
  });

  done();
}

fastify.register(routes);

/**
 * Run the server!
 */
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
    console.log(`server listening on 3000`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()