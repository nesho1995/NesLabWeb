using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using NesLab.Infrastructure.Persistence;

#nullable disable

namespace NesLab.Infrastructure.Persistence.Migrations;

[DbContext(typeof(NesLabDbContext))]
[Migration("20260423190000_AddOfflineSyncRegularizations")]
public class AddOfflineSyncRegularizations : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "offline_sync_regularizaciones",
            columns: table => new
            {
                id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                empresa_id = table.Column<int>(type: "int", nullable: false),
                temp_id = table.Column<string>(type: "varchar(80)", maxLength: 80, nullable: false)
                    .Annotation("MySql:CharSet", "utf8mb4"),
                orden_id = table.Column<int>(type: "int", nullable: false),
                numero_factura = table.Column<string>(type: "varchar(60)", maxLength: 60, nullable: false)
                    .Annotation("MySql:CharSet", "utf8mb4"),
                cai_mode = table.Column<bool>(type: "tinyint(1)", nullable: false),
                solicito_cai = table.Column<bool>(type: "tinyint(1)", nullable: false),
                paciente_nombre = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                    .Annotation("MySql:CharSet", "utf8mb4"),
                fuente = table.Column<string>(type: "varchar(40)", maxLength: 40, nullable: false)
                    .Annotation("MySql:CharSet", "utf8mb4"),
                regularizado_en_utc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_offline_sync_regularizaciones", x => x.id);
                table.ForeignKey(
                    name: "FK_offline_sync_regularizaciones_empresas_empresa_id",
                    column: x => x.empresa_id,
                    principalTable: "empresas",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_offline_sync_regularizaciones_ordenes_orden_id",
                    column: x => x.orden_id,
                    principalTable: "ordenes",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            })
            .Annotation("MySql:CharSet", "utf8mb4");

        migrationBuilder.CreateIndex(
            name: "IX_offline_sync_regularizaciones_empresa_id_regularizado_en_utc",
            table: "offline_sync_regularizaciones",
            columns: new[] { "empresa_id", "regularizado_en_utc" });

        migrationBuilder.CreateIndex(
            name: "IX_offline_sync_regularizaciones_empresa_id_temp_id_orden_id",
            table: "offline_sync_regularizaciones",
            columns: new[] { "empresa_id", "temp_id", "orden_id" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_offline_sync_regularizaciones_orden_id",
            table: "offline_sync_regularizaciones",
            column: "orden_id");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "offline_sync_regularizaciones");
    }
}
