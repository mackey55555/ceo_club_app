-- CreateTable
CREATE TABLE "member_statuses" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "circles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "full_name" VARCHAR(100) NOT NULL,
    "profile_image_url" VARCHAR(500),
    "gender" VARCHAR(20),
    "birth_date" DATE,
    "company_name" VARCHAR(200),
    "district" VARCHAR(100),
    "status_id" UUID NOT NULL,
    "expo_push_token" VARCHAR(255),
    "terms_agreed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_circles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "circle_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_circles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_statuses" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "news_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "thumbnail_url" VARCHAR(500),
    "status_id" UUID NOT NULL,
    "publish_at" TIMESTAMPTZ(6),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_statuses" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "event_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "thumbnail_url" VARCHAR(500),
    "event_date" DATE NOT NULL,
    "start_time" TEXT,
    "end_time" TEXT,
    "venue" VARCHAR(200),
    "capacity" INTEGER,
    "cancel_deadline" TIMESTAMPTZ(6),
    "status_id" UUID NOT NULL,
    "publish_at" TIMESTAMPTZ(6),
    "allow_guest" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_applications" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'applied',
    "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMPTZ(6),

    CONSTRAINT "event_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_applications" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "company_name" VARCHAR(200),
    "job_title" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'applied',
    "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMPTZ(6),

    CONSTRAINT "guest_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "administrators" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "administrators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_logs" (
    "id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "target_type" VARCHAR(50),
    "target_id" UUID,
    "details" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_statuses_name_key" ON "member_statuses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "circles_name_key" ON "circles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_circles_user_id_circle_id_key" ON "user_circles"("user_id", "circle_id");

-- CreateIndex
CREATE UNIQUE INDEX "news_statuses_name_key" ON "news_statuses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "event_statuses_name_key" ON "event_statuses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "event_applications_event_id_user_id_key" ON "event_applications"("event_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "administrators_email_key" ON "administrators"("email");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "member_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_circles" ADD CONSTRAINT "user_circles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_circles" ADD CONSTRAINT "user_circles_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "circles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "news_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "event_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_applications" ADD CONSTRAINT "event_applications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_applications" ADD CONSTRAINT "event_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_applications" ADD CONSTRAINT "guest_applications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "administrators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
