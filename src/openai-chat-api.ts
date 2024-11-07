import { FastifyReply, FastifyRequest } from 'fastify'
import { configure_openai } from './azure-authentication.js'
import { AzureOpenAI } from "openai";

import { ChatCompletionMessageParam, ChatCompletionChunk } from 'openai/resources/chat/completions'
interface ChatRequestBody {
    messages: ChatCompletionMessageParam [];
  }
export async function chatRoute (request: FastifyRequest<{ Body: ChatRequestBody }>, reply: FastifyReply) {

    const requestMessages: ChatCompletionMessageParam[] = request?.body?.messages;
    console.log('requestMessages', requestMessages);
    const openaiClient: AzureOpenAI | undefined = configure_openai();

    if (!openaiClient) {
      throw new Error("Azure OpenAI client is not configured");
    }

    const allMessages = [
      { role: "system", content: "You are a helpful assistant.", name: '' },
      ...requestMessages
    ] as ChatCompletionMessageParam [];
    console.log('allMessages', allMessages);

    //add name property to each message with a value if an number such as 1 or 2 is present in the content
    allMessages.forEach((message, index) => {
      // @ts-nocheck
      message["name"] = index.toString();
    });
    console.log('allMessages 2', allMessages);

    const chatCompletionChunks = await openaiClient.chat.completions.create({
      // Azure Open AI takes the deployment name as the model name
      model: process.env.AZURE_OPENAI_CHAT_DEPLOYMENT_MODEL || "gpt-4o-mini",
      messages: allMessages,
      stream: true

    })
    reply.raw.setHeader('Content-Type', 'text/html; charset=utf-8');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.flushHeaders();

    for await (const chunk of chatCompletionChunks as AsyncIterable<ChatCompletionChunk>) {
      for (const choice of chunk.choices) {
        reply.raw.write(JSON.stringify(choice) + "\n")
      }
    }

    return reply.raw.end()

  }