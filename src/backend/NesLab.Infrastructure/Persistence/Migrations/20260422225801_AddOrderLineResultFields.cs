using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NesLab.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderLineResultFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "resultado_notas",
                table: "orden_detalle",
                type: "varchar(2000)",
                maxLength: 2000,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "validado_en_utc",
                table: "orden_detalle",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "validado_por_usuario_id",
                table: "orden_detalle",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_orden_detalle_validado_por_usuario_id",
                table: "orden_detalle",
                column: "validado_por_usuario_id");

            migrationBuilder.AddForeignKey(
                name: "FK_orden_detalle_users_validado_por_usuario_id",
                table: "orden_detalle",
                column: "validado_por_usuario_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_orden_detalle_users_validado_por_usuario_id",
                table: "orden_detalle");

            migrationBuilder.DropIndex(
                name: "IX_orden_detalle_validado_por_usuario_id",
                table: "orden_detalle");

            migrationBuilder.DropColumn(
                name: "resultado_notas",
                table: "orden_detalle");

            migrationBuilder.DropColumn(
                name: "validado_en_utc",
                table: "orden_detalle");

            migrationBuilder.DropColumn(
                name: "validado_por_usuario_id",
                table: "orden_detalle");
        }
    }
}
