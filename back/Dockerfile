FROM denoland/deno:2.9.8 AS development

WORKDIR /app

COPY deno.json ./
COPY . .

RUN deno cache mod.ts

EXPOSE 1405

CMD ["deno", "task", "dev"]

FROM denoland/deno:2.9.8 AS production

WORKDIR /app

COPY deno.json mod.ts ./
COPY models/ ./models/
COPY src/ ./src/
COPY utils/ ./utils/
COPY jobs/ ./jobs/
COPY http/ ./http/

RUN mkdir -p uploads

RUN deno cache mod.ts

EXPOSE 1405

CMD ["deno", "run", "--allow-all", "mod.ts"]
