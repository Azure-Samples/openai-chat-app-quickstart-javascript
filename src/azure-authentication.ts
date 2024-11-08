import { ChainedTokenCredential, DefaultAzureCredential, getBearerTokenProvider, ManagedIdentityCredential } from "@azure/identity";
import { AzureOpenAI } from "openai";

function getChainedCredential(): ChainedTokenCredential {
    // Create a ChainedTokenCredential with ManagedIdentityCredential and DefaultAzureCredential
    // - ManagedIdentityCredential is used for deployment on Azure Container Apps
    // - DefaultAzureCredential is used for local development
    // The order of the credentials is important, as the first valid token is used

    return new ChainedTokenCredential(
        new ManagedIdentityCredential(process.env.AZURE_CLIENT_ID!), 
        new DefaultAzureCredential({
            tenantId: process.env.AZURE_TENANT_ID ? process.env.AZURE_TENANT_ID : undefined
          })
    );
}

export function configure_openai(): AzureOpenAI | undefined{
    try {

        const chainedCredential  = getChainedCredential();

        if (!process.env.AZURE_OPENAI_ENDPOINT!) {
            throw new Error("AZURE_OPENAI_ENDPOINT is required for Azure OpenAI");
        }
        if (!process.env.AZURE_OPENAI_CHAT_DEPLOYMENT!) {
            throw new Error("AZURE_OPENAI_CHAT_DEPLOYMENT is required for Azure OpenAI");
        }

        const scope = "https://cognitiveservices.azure.com/.default";

        // Get the token provider for Azure OpenAI based on the selected Azure credential
        const azureADTokenProvider = getBearerTokenProvider(chainedCredential, scope);

        const options = { 
            azureADTokenProvider, 
            deployment: process.env.AZURE_OPENAI_CHAT_DEPLOYMENT!, 
            apiVersion: process.env.AZURE_OPENAI_API_VERSION! || "2024-02-15-preview",
            endpoint: process.env.AZURE_OPENAI_ENDPOINT!
        }

        // Create the Asynchronous Azure OpenAI client
        return new AzureOpenAI (options);

    } catch (error) {
        console.error('Get client error ', error);
    }
}