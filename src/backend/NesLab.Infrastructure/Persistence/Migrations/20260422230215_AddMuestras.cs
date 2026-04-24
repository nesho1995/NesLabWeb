using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NesLab.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMuestras : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "muestras",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    empresa_id = table.Column<int>(type: "int", nullable: false),
                    orden_id = table.Column<int>(type: "int", nullable: false),
                    codigo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    notas = table.Column<string>(type: "varchar(2000)", maxLength: 2000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    tomada_en_utc = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    creado_por_usuario_id = table.Column<int>(type: "int", nullable: true),
                    creado_en_utc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_muestras", x => x.id);
                    table.ForeignKey(
                        name: "FK_muestras_empresas_empresa_id",
                        column: x => x.empresa_id,
                        principalTable: "empresas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_muestras_ordenes_orden_id",
                        column: x => x.orden_id,
                        principalTable: "ordenes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_muestras_users_creado_por_usuario_id",
                        column: x => x.creado_por_usuario_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_muestras_creado_por_usuario_id",
                table: "muestras",
                column: "creado_por_usuario_id");

            migrationBuilder.CreateIndex(
                name: "IX_muestras_empresa_id_codigo",
                table: "muestras",
                columns: new[] { "empresa_id", "codigo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_muestras_empresa_id_orden_id",
                table: "muestras",
                columns: new[] { "empresa_id", "orden_id" });

            migrationBuilder.CreateIndex(
                name: "IX_muestras_orden_id",
                table: "muestras",
                column: "orden_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "muestras");
        }
    }
}
