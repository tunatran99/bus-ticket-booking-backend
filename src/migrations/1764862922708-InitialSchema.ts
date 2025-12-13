import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1764862922708 implements MigrationInterface {
    name = 'InitialSchema1764862922708'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "permissions" ("id" SERIAL NOT NULL, "name" character varying(120) NOT NULL, "description" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_48ce552495d14eae9b187bb6716" UNIQUE ("name"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "description" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "user_id" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(30), "full_name" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "role" character varying(50) NOT NULL, "status" character varying(50) NOT NULL DEFAULT 'active', "last_login_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_96aac72f1574b88752e9fb00089" UNIQUE ("user_id"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a000cca60bcf04454e72769949" ON "users" ("phone") `);
        await queryRunner.query(`CREATE TABLE "route_stops" ("id" SERIAL NOT NULL, "routeId" integer NOT NULL, "locationName" character varying(255) NOT NULL, "address" character varying(255), "latitude" numeric(10,7), "longitude" numeric(10,7), "order" integer NOT NULL, "minutesFromStart" integer NOT NULL DEFAULT '0', "isPickup" boolean NOT NULL DEFAULT true, "isDropoff" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_22c09afc24c0a7a13644c629073" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_36bb5d65a60351a7720938908c" ON "route_stops" ("routeId", "order") `);
        await queryRunner.query(`CREATE TABLE "routes" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "description" character varying(255), "distance" integer NOT NULL DEFAULT '0', "estimatedDuration" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_76100511cdfa1d013c859f01d8b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."seat_layouts_seattype_enum" AS ENUM('regular', 'vip', 'sleeper')`);
        await queryRunner.query(`CREATE TYPE "public"."seat_layouts_position_enum" AS ENUM('window', 'aisle', 'middle')`);
        await queryRunner.query(`CREATE TABLE "seat_layouts" ("id" SERIAL NOT NULL, "busId" integer NOT NULL, "seatNumber" character varying(10) NOT NULL, "row" integer NOT NULL, "column" character varying(1) NOT NULL, "seatType" "public"."seat_layouts_seattype_enum" NOT NULL DEFAULT 'regular', "position" "public"."seat_layouts_position_enum", "basePrice" numeric(10,2) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_248f4bfc8320776a1a4217c7f50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1e42e69a5c2fcf6d6c8d4e6334" ON "seat_layouts" ("busId", "seatNumber") `);
        await queryRunner.query(`CREATE TABLE "buses" ("id" SERIAL NOT NULL, "licensePlate" character varying(50) NOT NULL, "brand" character varying(100), "model" character varying(100), "totalSeats" integer NOT NULL, "status" character varying(50) NOT NULL DEFAULT 'active', "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_30451cb6cc6ff3c13a64a8e1661" UNIQUE ("licensePlate"), CONSTRAINT "PK_ddebc0eeba64a019ae072975947" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_30451cb6cc6ff3c13a64a8e166" ON "buses" ("licensePlate") `);
        await queryRunner.query(`CREATE TYPE "public"."trips_status_enum" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "trips" ("id" SERIAL NOT NULL, "routeId" integer NOT NULL, "busId" integer NOT NULL, "departureTime" TIMESTAMP NOT NULL, "arrivalTime" TIMESTAMP, "status" "public"."trips_status_enum" NOT NULL DEFAULT 'scheduled', "basePrice" numeric(10,2) NOT NULL, "availableSeats" integer NOT NULL DEFAULT '0', "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f71c231dee9c05a9522f9e840f5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8ee34d0a74c7fadb84bf8561c8" ON "trips" ("routeId", "departureTime") `);
        await queryRunner.query(`CREATE INDEX "IDX_60e98baaa0f9fed12eb11a2a27" ON "trips" ("busId", "departureTime") `);
        await queryRunner.query(`CREATE TABLE "role_permissions" ("role_id" integer NOT NULL, "permission_id" integer NOT NULL, CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY ("role_id", "permission_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON "role_permissions" ("role_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON "role_permissions" ("permission_id") `);
        await queryRunner.query(`CREATE TABLE "user_roles" ("user_id" character varying(100) NOT NULL, "role_id" integer NOT NULL, CONSTRAINT "PK_23ed6f04fe43066df08379fd034" PRIMARY KEY ("user_id", "role_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_87b8888186ca9769c960e92687" ON "user_roles" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b23c65e50a758245a33ee35fda" ON "user_roles" ("role_id") `);
        await queryRunner.query(`ALTER TABLE "route_stops" ADD CONSTRAINT "FK_352e45964a86c097a435f643004" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "seat_layouts" ADD CONSTRAINT "FK_e3a5c4e319374dda9d0905ee6b9" FOREIGN KEY ("busId") REFERENCES "buses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trips" ADD CONSTRAINT "FK_3fcad6442389eeb7aea5f1f25a8" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trips" ADD CONSTRAINT "FK_5cb200e0bc5828053dd3d60cfd8" FOREIGN KEY ("busId") REFERENCES "buses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`);
        await queryRunner.query(`ALTER TABLE "trips" DROP CONSTRAINT "FK_5cb200e0bc5828053dd3d60cfd8"`);
        await queryRunner.query(`ALTER TABLE "trips" DROP CONSTRAINT "FK_3fcad6442389eeb7aea5f1f25a8"`);
        await queryRunner.query(`ALTER TABLE "seat_layouts" DROP CONSTRAINT "FK_e3a5c4e319374dda9d0905ee6b9"`);
        await queryRunner.query(`ALTER TABLE "route_stops" DROP CONSTRAINT "FK_352e45964a86c097a435f643004"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b23c65e50a758245a33ee35fda"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_87b8888186ca9769c960e92687"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_17022daf3f885f7d35423e9971"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_178199805b901ccd220ab7740e"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_60e98baaa0f9fed12eb11a2a27"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8ee34d0a74c7fadb84bf8561c8"`);
        await queryRunner.query(`DROP TABLE "trips"`);
        await queryRunner.query(`DROP TYPE "public"."trips_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_30451cb6cc6ff3c13a64a8e166"`);
        await queryRunner.query(`DROP TABLE "buses"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1e42e69a5c2fcf6d6c8d4e6334"`);
        await queryRunner.query(`DROP TABLE "seat_layouts"`);
        await queryRunner.query(`DROP TYPE "public"."seat_layouts_position_enum"`);
        await queryRunner.query(`DROP TYPE "public"."seat_layouts_seattype_enum"`);
        await queryRunner.query(`DROP TABLE "routes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_36bb5d65a60351a7720938908c"`);
        await queryRunner.query(`DROP TABLE "route_stops"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a000cca60bcf04454e72769949"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
    }

}
