ALTER TABLE "documents" ADD COLUMN "herkunft_hash" text;--> statement-breakpoint
CREATE INDEX "documents_herkunft_idx" ON "documents" USING btree ("herkunft_hash","created_at");