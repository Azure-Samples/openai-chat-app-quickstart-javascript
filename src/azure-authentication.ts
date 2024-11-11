import { ChainedTokenCredential, AzureDeveloperCliCredential, getBearerTokenProvider, ManagedIdentityCredential } from "@azure/identity";
import { AzureOpenAI } from "openai";

// Create a ChainedTokenCredential with ManagedIdentityCredential and AzureDeveloperCliCredential
function getChainedCredential(): ChainedTokenCredential {
    
    // - ManagedIdentityCredential is used for deployment on Azure Container Apps
    // - AzureDeveloperCliCredential is used for local development
    // The order of the credentials is important, as the first valid token is used

    return new ChainedTokenCredential(
        new ManagedIdentityCredential(process.env.AZURE_CLIENT_ID!), 
        new AzureDeveloperCliCredential({
            tenantId: process.env.AZURE_TENANT_ID! ? process.env.AZURE_TENANT_ID! : undefined
          })
    );
}

// Get the token provider for Azure OpenAI based on the selected Azure credential
function getTokenProvider(): () => Promise<string> {
    const credential  = getChainedCredential();
    const scope = "https://cognitiveservices.azure.com/.default";
    return getBearerTokenProvider(credential, scope);
}

// Get OpenAI client for Azure 
export function getOpenAiClient(): AzureOpenAI | undefined{
    try {

        if (!process.env.AZURE_OPENAI_ENDPOINT) {
            throw new Error("AZURE_OPENAI_ENDPOINT is required for Azure OpenAI");
        }
        if (!process.env.AZURE_OPENAI_CHAT_DEPLOYMENT) {
            throw new Error("AZURE_OPENAI_CHAT_DEPLOYMENT is required for Azure OpenAI");
        }

        const options = { 
            azureADTokenProvider: getTokenProvider(), 
            deployment: process.env.AZURE_OPENAI_CHAT_DEPLOYMENT!, 
            apiVersion: process.env.AZURE_OPENAI_API_VERSION! || "2024-02-15-preview",
            endpoint: process.env.AZURE_OPENAI_ENDPOINT!
        }

        // Create the Asynchronous Azure OpenAI client
        return new AzureOpenAI (options);

    } catch (error) {
        console.error('Error getting Azure OpenAI client: ', error);
    }
}