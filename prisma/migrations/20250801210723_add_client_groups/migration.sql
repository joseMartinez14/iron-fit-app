-- CreateTable
CREATE TABLE "ClientGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ClientGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientGroupMembership" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientGroupId" TEXT NOT NULL,

    CONSTRAINT "ClientGroupMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientGroup_name_key" ON "ClientGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ClientGroupMembership_clientId_clientGroupId_key" ON "ClientGroupMembership"("clientId", "clientGroupId");

-- AddForeignKey
ALTER TABLE "ClientGroupMembership" ADD CONSTRAINT "ClientGroupMembership_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientGroupMembership" ADD CONSTRAINT "ClientGroupMembership_clientGroupId_fkey" FOREIGN KEY ("clientGroupId") REFERENCES "ClientGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
