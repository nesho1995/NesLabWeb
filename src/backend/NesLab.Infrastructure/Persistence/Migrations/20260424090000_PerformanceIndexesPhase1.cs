using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NesLab.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PerformanceIndexesPhase1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_ordenes_empresa_estado_fecha",
                table: "ordenes",
                columns: new[] { "empresa_id", "estado", "fecha" });

            migrationBuilder.CreateIndex(
                name: "IX_orden_detalle_orden_validado",
                table: "orden_detalle",
                columns: new[] { "orden_id", "validado_en_utc" });

            migrationBuilder.CreateIndex(
                name: "IX_orden_detalle_examen_validado",
                table: "orden_detalle",
                columns: new[] { "examen_id", "validado_en_utc" });

            migrationBuilder.CreateIndex(
                name: "IX_muestras_empresa_creado",
                table: "muestras",
                columns: new[] { "empresa_id", "creado_en_utc" });

            migrationBuilder.CreateIndex(
                name: "IX_offline_sync_regularizaciones_empresa_orden",
                table: "offline_sync_regularizaciones",
                columns: new[] { "empresa_id", "orden_id" });

            migrationBuilder.CreateIndex(
                name: "IX_pagos_orden_fecha",
                table: "pagos",
                columns: new[] { "orden_id", "fecha" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ordenes_empresa_estado_fecha",
                table: "ordenes");

            migrationBuilder.DropIndex(
                name: "IX_orden_detalle_orden_validado",
                table: "orden_detalle");

            migrationBuilder.DropIndex(
                name: "IX_orden_detalle_examen_validado",
                table: "orden_detalle");

            migrationBuilder.DropIndex(
                name: "IX_muestras_empresa_creado",
                table: "muestras");

            migrationBuilder.DropIndex(
                name: "IX_offline_sync_regularizaciones_empresa_orden",
                table: "offline_sync_regularizaciones");

            migrationBuilder.DropIndex(
                name: "IX_pagos_orden_fecha",
                table: "pagos");
        }
    }
}
