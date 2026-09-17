CREATE TABLE "usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" text,
	"operation" text NOT NULL,
	"status" text DEFAULT 'reserviert' NOT NULL,
	"modell" text NOT NULL,
	"eingabe_tokens" integer,
	"ausgabe_tokens" integer,
	"kosten_mikro_usd" integer NOT NULL,
	"preisstand" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usage_events_status_gueltig" CHECK ("usage_events"."status" IN ('reserviert', 'abgerechnet', 'unklar')),
	CONSTRAINT "usage_events_operation_gueltig" CHECK ("usage_events"."operation" IN ('antwort', 'reparatur'))
);
--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "usage_events_zeitraum_idx" ON "usage_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "usage_events_nutzer_idx" ON "usage_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "usage_events_sitzung_idx" ON "usage_events" USING btree ("session_id");