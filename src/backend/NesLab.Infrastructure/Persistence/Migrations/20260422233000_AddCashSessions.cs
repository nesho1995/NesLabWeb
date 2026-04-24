using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using NesLab.Infrastructure.Persistence;

#nullable disable

namespace NesLab.Infrastructure.Persistence.Migrations;

[DbContextAttribute(typeof(NesLabDbContext))]
[Migration("20260422233000_AddCashSessions")]
public class AddCashSessions : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "caja_sesiones",
            columns: table => new
            {
                id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                empresa_id = table.Column<int>(type: "int", nullable: false),
                apertura_en_utc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                cierre_en_utc = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                usuario_apertura_id = table.Column<int>(type: "int", nullable: false),
                usuario_cierre_id = table.Column<int>(type: "int", nullable: true),
                caja_chica_inicial = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                declarado_cierre = table.Column<decimal>(type: "decimal(12,2)", nullable: true),
                esperado_cierre = table.Column<decimal>(type: "decimal(12,2)", nullable: true),
                diferencia_cierre = table.Column<decimal>(type: "decimal(12,2)", nullable: true),
                notas_cierre = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                    .Annotation("MySql:CharSet", "utf8mb4")
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_caja_sesiones", x => x.id);
                table.ForeignKey(
                    name: "FK_caja_sesiones_empresas_empresa_id",
                    column: x => x.empresa_id,
                    principalTable: "empresas",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_caja_sesiones_users_usuario_apertura_id",
                    column: x => x.usuario_apertura_id,
                    principalTable: "users",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_caja_sesiones_users_usuario_cierre_id",
                    column: x => x.usuario_cierre_id,
                    principalTable: "users",
                    principalColumn: "id",
                    onDelete: ReferentialAction.SetNull);
            })
            .Annotation("MySql:CharSet", "utf8mb4");

        migrationBuilder.CreateIndex(
            name: "IX_caja_sesiones_empresa_id_cierre_en_utc",
            table: "caja_sesiones",
            columns: new[] { "empresa_id", "cierre_en_utc" });

        migrationBuilder.CreateIndex(
            name: "IX_caja_sesiones_usuario_apertura_id",
            table: "caja_sesiones",
            column: "usuario_apertura_id");

        migrationBuilder.CreateIndex(
            name: "IX_caja_sesiones_usuario_cierre_id",
            table: "caja_sesiones",
            column: "usuario_cierre_id");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "caja_sesiones");
    }
}
