-- CreateTable
CREATE TABLE "Assessment" (
    "id" SERIAL NOT NULL,
    "roofArea" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "totalRainfallMM" DOUBLE PRECISION NOT NULL,
    "litersHarvested" DOUBLE PRECISION NOT NULL,
    "hasGarden" BOOLEAN NOT NULL,
    "wantsDrinking" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);
