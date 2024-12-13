#!/usr/bin/env node

import "dotenv/config";

import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import fastify from "fastify";

import { parseEnv } from "@bin/parseEnv";
import { AppRouter, createAppRouter } from "@/createAppRouter";
import { KeeperService } from "@/KeeperService";

const env = parseEnv();

// @see https://fastify.dev/docs/latest/
const server = fastify({
  maxParamLength: 5000,
  logger: false,
});

await server.register(import("@fastify/compress"));
await server.register(import("@fastify/cors"));

// k8s healthchecks
server.get("/healthz", (req, res) => res.code(200).send());
server.get("/readyz", (req, res) => res.code(200).send());

const keeperService = new KeeperService(env.KEEPER_PRIVATE_KEY);

server.addHook("preHandler", (req, reply, done) => {
  if (req.headers.authorization !== `Bearer ${env.KEEPER_BEARER_TOKEN}`) {
    reply.code(401).send({ error: "Unauthorized" });
  } else {
    done();
  }
});

// @see https://trpc.io/docs/server/adapters/fastify
server.register(fastifyTRPCPlugin<AppRouter>, {
  prefix: "/trpc",
  trpcOptions: {
    router: createAppRouter(),
    createContext: async () => ({ keeperService }),
  },
});

await server.listen({ host: env.KEEPER_HOST, port: env.KEEPER_PORT });
console.log(`keeper server listening on http://${env.KEEPER_HOST}:${env.KEEPER_PORT}`);
