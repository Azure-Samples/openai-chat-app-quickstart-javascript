import { FastifyReply, FastifyRequest } from 'fastify';
import { AzureOpenAI } from "openai";
import { getOpenAiClient } from './azure-authentication.js';

import { ChatCompletionChunk, ChatCompletionMessageParam } from 'openai/resources/chat/completions';
interface ChatRequestBody {
    messages: ChatCompletionMessageParam [];
  }
export async function chatRoute (request: FastifyRequest<{ Body: ChatRequestBody }>, reply: FastifyReply) {

    const requestMessages: ChatCompletionMessageParam[] = request?.body?.messages;
    const openaiClient: AzureOpenAI | undefined = getOpenAiClient();

    if (!openaiClient) {
      throw new Error("Azure OpenAI client is not configured");
    }

    const allMessages = [
      { role: "system", content: "You are a helpful assistant."},
      ...requestMessages
    ] as ChatCompletionMessageParam [];

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

    reply.raw.end()

  }