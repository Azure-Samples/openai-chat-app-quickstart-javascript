# ------------------- Stage 0: Base Stage ------------------------------
    FROM node:20-alpine AS base

    WORKDIR /code
    
    # Install dependencies
    COPY package.json package-lock.json ./
    RUN npm install
    
    # ------------------- Stage 1: Build Stage ------------------------------
    FROM base AS build
    
    # Copy the rest of the application code
    COPY . .
    
    # Compile TypeScript to JavaScript
    RUN npm run build
    
    # ------------------- Stage 2: Final Stage ------------------------------
    FROM node:20-alpine AS final
    
    WORKDIR /code
    
    # Copy only the necessary files from the build stage
    COPY --from=build /code/dist /code/dist
    COPY --from=build /code/node_modules /code/node_modules
    COPY --from=build /code/package.json /code/package.json
    
    # Add a non-root user
    RUN addgroup -S app && adduser -S app -G app
    USER app
    
    EXPOSE 3000
    
    # Start the application
    CMD ["node", "dist/index.js"]