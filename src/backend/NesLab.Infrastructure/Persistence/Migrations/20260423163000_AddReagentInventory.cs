using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using NesLab.Infrastructure.Persistence;

#nullable disable

namespace NesLab.Infrastructure.Persistence.Migrations;

[DbContext(typeof(NesLabDbContext))]
[Migration("20260423163000_AddReagentInventory")]
public class AddReagentInventory : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "inventario_reactivos",
            columns: table => new
            {
                id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                empresa_id = table.Column<int>(type: "int", nullable: false),
                codigo = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false)
                    .Annotation("MySql:CharSet", "utf8mb4"),
                nombre = table.Column<string>(type: "varchar(120)", maxLength: 120, nullable: false)
                    .Annotation("MySql:CharSet", "utf8mb4"),
                unidad = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                    .Annotation("MySql:CharSet", "utf8mb4"),
                existencia = table.Column<decimal>(type: "decimal(14,3)", nullable: false),
                minimo = table.Column<decimal>(type: "decimal(14,3)", nullable: false),
                activo = table.Column<bool>(type: "tinyint(1)", nullable: false),
                actualizado_en_utc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_inventario_reactivos", x => x.id);
                table.ForeignKey(
                    name: "FK_inventario_reactivos_empresas_empresa_id",
                    column: x => x.empresa_id,
                    principalTable: "empresas",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            })
            .Annotation("MySql:CharSet", "utf8mb4");

        migrationBuilder.CreateIndex(
            name: "IX_inventario_reactivos_empresa_id_activo",
            table: "inventario_reactivos",
            columns: new[] { "empresa_id", "activo" });

        migrationBuilder.CreateIndex(
            name: "IX_inventario_reactivos_empresa_id_codigo",
            table: "inventario_reactivos",
            columns: new[] { "empresa_id", "codigo" },
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "inventario_reactivos");
    }
}
