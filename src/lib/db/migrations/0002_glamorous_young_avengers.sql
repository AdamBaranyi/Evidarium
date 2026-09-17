ALTER TABLE "document_chunks" ADD COLUMN "embedding" vector(384);--> statement-breakpoint
ALTER TABLE "document_chunks" ADD COLUMN "embedding_model" text;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD COLUMN "search_de" "tsvector" GENERATED ALWAYS AS (to_tsvector('german', "document_chunks"."text")) STORED;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD COLUMN "search_en" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', "document_chunks"."text")) STORED;--> statement-breakpoint
CREATE INDEX "document_chunks_embedding_idx" ON "document_chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "document_chunks_search_de_idx" ON "document_chunks" USING gin ("search_de");--> statement-breakpoint
CREATE INDEX "document_chunks_search_en_idx" ON "document_chunks" USING gin ("search_en");