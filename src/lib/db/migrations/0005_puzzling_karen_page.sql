ALTER TABLE "usage_events" ADD COLUMN "origin_hash" text;--> statement-breakpoint
CREATE INDEX "usage_events_herkunft_idx" ON "usage_events" USING btree ("origin_hash","created_at");