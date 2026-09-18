DROP INDEX "documents_hash_je_nutzer_idx";--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "besucher_hash" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "ablauf_am" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "documents_besucher_idx" ON "documents" USING btree ("besucher_hash","ablauf_am");--> statement-breakpoint
CREATE UNIQUE INDEX "documents_hash_je_nutzer_idx" ON "documents" USING btree ("user_id","content_hash","besucher_hash");