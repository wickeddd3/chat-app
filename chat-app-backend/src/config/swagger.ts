import type { Options } from "swagger-jsdoc";
import swaggerJSDoc from "swagger-jsdoc";
import { combinedPaths, combinedSchemas } from "@/modules/docs.index";
import { API_URL, PORT } from "./app.config";

const localDevServer = `http://localhost:${String(PORT)}`;
const productionDevServer = API_URL;

const swaggerOptions: Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Chat app API",
      version: "1.0.0",
      description: "Scalable modular API documentation engine.",
    },
    servers: [
      {
        url: localDevServer,
        description: "Local Development Server (Your Machine)",
      },
      {
        url: productionDevServer,
        description: "Production Development Server (Remote Staging/Cloud)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: {},
            meta: {
              type: "object",
              nullable: true,
              properties: {
                limit: { type: "integer" },
                nextCursor: { oneOf: [{ type: "string" }, { type: "integer" }], nullable: true },
                hasMore: { type: "boolean" },
              },
            },
            timestamp: { type: "string", format: "date-time" },
          },
        },
        ...combinedSchemas,
      },
    },
    paths: combinedPaths,
  },
  apis: [],
};

export const swaggerSpecs = swaggerJSDoc(swaggerOptions);
