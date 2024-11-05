import Fastify from 'fastify'
import path from 'path'
import fastifyStatic from 'fastify-static'
import { fileURLToPath } from 'url'

// Define __dirname in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fastify = Fastify({
  logger: true
})

// Register the fastify-static plugin
fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'public'),
    prefix: '/', // optional: default '/'
  })

// Serve an HTML file for the root route
fastify.get('/', async (request, reply) => {
    return reply.sendFile('index.html') // Ensure you have an index.html in the public directory
  })

/**
 * Run the server!
 */
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
    console.log(`server listening on ${fastify.server.address().port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()