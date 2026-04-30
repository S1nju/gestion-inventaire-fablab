FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
	bash \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

EXPOSE 3000

ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0

CMD ["npm", "run", "dev"]
