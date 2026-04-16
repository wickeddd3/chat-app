FROM node:20
WORKDIR /app

# Define ARGs so Docker can receive them during the build phase
ARG VITE_API_URL

# Set them as ENV so Vite's build process can see them
ENV VITE_API_URL=$VITE_API_URL

# Prevent esbuild architecture mismatch
COPY package*.json ./
COPY yarn.lock* ./

RUN npm install --frozen-lockfile

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev"]