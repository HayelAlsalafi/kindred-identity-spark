CREATE TYPE "public"."topic_status" AS ENUM('ACTIVE', 'DISABLED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'DISABLED');--> statement-breakpoint
CREATE TABLE "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(180) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"status" "topic_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "topics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"display_name" varchar(180) NOT NULL,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "topics_status_order_idx" ON "topics" USING btree ("status","display_order");--> statement-breakpoint
CREATE INDEX "users_role_status_idx" ON "users" USING btree ("role","status");--> statement-breakpoint
CREATE INDEX "users_last_login_idx" ON "users" USING btree ("last_login_at");