import Fastify from 'fastify'
import path from 'path'
import fastifyStatic from '@fastify/static'
import { fileURLToPath } from 'url'
import { configure_openai } from './openai-chat.js'

// Define __dirname in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fastify = Fastify({
  logger: true
})

// Register the fastify-static plugin
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/public',
})

const routes = (fastify, opts, done) => {

  fastify.post('/chat/stream', async (request, reply) => {

    const requestMessages = request.body.messages;
    const openaiClient = configure_openai();

    const allMessages = [
      { role: "system", content: "You are a helpful assistant." },
    ].concat(requestMessages);

    const chatStreamResponse = openaiClient.beta.chat.completions.stream({
      // Azure Open AI takes the deployment name as the model name
      model: process.env.AZURE_OPENAI_CHAT_DEPLOYMENT_MODEL || "gpt-4o-mini",
      messages: allMessages,
      stream: true
    })
    reply.header('Content-Type', 'text/plain');
    reply.send(chatStreamResponse)
  });

  fastify.get('/', (request, reply) => {
    console.log('index.html')
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
    console.log(`server listening on ${fastify.server.address().port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()