import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import path from 'path'
import fastifyStatic from '@fastify/static'
import { fileURLToPath } from 'url'
import { configure_openai } from './openai-chat'
import { ReadableStream } from 'node:stream/web'

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

interface ChatCompletionMessage {
  role: string;
  content: string;
  name: string;
}

interface ChatRequestBody {
  messages: ChatCompletionMessage[];
}

const routes = (fastify: FastifyInstance, _: any, done: () => void) => {

  fastify.post('/chat/stream', async (request: FastifyRequest<{ Body: ChatRequestBody }>, reply) => {

    const requestMessages: ChatCompletionMessage[] = request?.body?.messages;
    const openaiClient = configure_openai();

    if (!openaiClient) {
      throw new Error("Azure OpenAI client is not configured");
    }

    const allMessages = [
      { role: "system", content: "You are a helpful assistant.", name: '' },
      ...requestMessages
    ] as ChatCompletionMessage[];

    const events = await openaiClient.chat.completions.create({
      // Azure Open AI takes the deployment name as the model name
      model: process.env.AZURE_OPENAI_CHAT_DEPLOYMENT_MODEL || "gpt-4o-mini",
      messages: allMessages as unknown,
      stream: true

    })
    reply.raw.setHeader('Content-Type', 'text/html; charset=utf-8');

    for await (const event of events) {
      for (const choice of event.choices) {
        reply.raw.write(JSON.stringify(choice) + "\n")
      }
    }

    return reply.raw.end()

  });

  fastify.get('/', (_: FastifyRequest, reply: FastifyReply) => {
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
    console.log(`server listening on 3000`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()