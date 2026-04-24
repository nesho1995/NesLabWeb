using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NesLab.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFiscalAndOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "cai",
                table: "empresas",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "factura_actual",
                table: "empresas",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "factura_fin",
                table: "empresas",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "factura_inicio",
                table: "empresas",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "fecha_limite_cai",
                table: "empresas",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "prefijo_factura",
                table: "empresas",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "INT")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "rango_facturacion",
                table: "empresas",
                type: "varchar(200)",
                maxLength: 200,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<bool>(
                name: "usar_cai",
                table: "empresas",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "descuentos",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    empresa_id = table.Column<int>(type: "int", nullable: true),
                    nombre = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    porcentaje = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    activo = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    orden_lista = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_descuentos", x => x.id);
                    table.ForeignKey(
                        name: "FK_descuentos_empresas_empresa_id",
                        column: x => x.empresa_id,
                        principalTable: "empresas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ordenes",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    empresa_id = table.Column<int>(type: "int", nullable: false),
                    paciente_id = table.Column<int>(type: "int", nullable: false),
                    numero_factura = table.Column<string>(type: "varchar(40)", maxLength: 40, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fecha = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    subtotal = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    descuento_porcentaje = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    descuento_monto = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    isv = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    total_final = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    tipo_descuento = table.Column<string>(type: "varchar(120)", maxLength: 120, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    estado = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nombre_factura_cliente = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    rtn_cliente = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    cai_resumen = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    rango_resumen = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    cai_venc_resumen = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    cai_activa = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    creado_por_usuario_id = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ordenes", x => x.id);
                    table.ForeignKey(
                        name: "FK_ordenes_empresas_empresa_id",
                        column: x => x.empresa_id,
                        principalTable: "empresas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ordenes_pacientes_paciente_id",
                        column: x => x.paciente_id,
                        principalTable: "pacientes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ordenes_users_creado_por_usuario_id",
                        column: x => x.creado_por_usuario_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "idempotency_keys",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    key_hash = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    orden_id = table.Column<int>(type: "int", nullable: true),
                    creado_en_utc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    expira_en_utc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_idempotency_keys", x => x.id);
                    table.ForeignKey(
                        name: "FK_idempotency_keys_ordenes_orden_id",
                        column: x => x.orden_id,
                        principalTable: "ordenes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_idempotency_keys_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "orden_detalle",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    orden_id = table.Column<int>(type: "int", nullable: false),
                    examen_id = table.Column<int>(type: "int", nullable: false),
                    examen_nombre = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    precio_base = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    descuento_linea = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    precio = table.Column<decimal>(type: "decimal(12,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_orden_detalle", x => x.id);
                    table.ForeignKey(
                        name: "FK_orden_detalle_examenes_examen_id",
                        column: x => x.examen_id,
                        principalTable: "examenes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_orden_detalle_ordenes_orden_id",
                        column: x => x.orden_id,
                        principalTable: "ordenes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "pagos",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    orden_id = table.Column<int>(type: "int", nullable: false),
                    metodo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    monto = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    fecha = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pagos", x => x.id);
                    table.ForeignKey(
                        name: "FK_pagos_ordenes_orden_id",
                        column: x => x.orden_id,
                        principalTable: "ordenes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_descuentos_empresa_id",
                table: "descuentos",
                column: "empresa_id");

            migrationBuilder.CreateIndex(
                name: "IX_idempotency_keys_orden_id",
                table: "idempotency_keys",
                column: "orden_id");

            migrationBuilder.CreateIndex(
                name: "IX_idempotency_keys_user_id_key_hash",
                table: "idempotency_keys",
                columns: new[] { "user_id", "key_hash" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_orden_detalle_examen_id",
                table: "orden_detalle",
                column: "examen_id");

            migrationBuilder.CreateIndex(
                name: "IX_orden_detalle_orden_id",
                table: "orden_detalle",
                column: "orden_id");

            migrationBuilder.CreateIndex(
                name: "IX_ordenes_creado_por_usuario_id",
                table: "ordenes",
                column: "creado_por_usuario_id");

            migrationBuilder.CreateIndex(
                name: "IX_ordenes_empresa_id_fecha",
                table: "ordenes",
                columns: new[] { "empresa_id", "fecha" });

            migrationBuilder.CreateIndex(
                name: "IX_ordenes_empresa_id_numero_factura",
                table: "ordenes",
                columns: new[] { "empresa_id", "numero_factura" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ordenes_paciente_id",
                table: "ordenes",
                column: "paciente_id");

            migrationBuilder.CreateIndex(
                name: "IX_pagos_orden_id",
                table: "pagos",
                column: "orden_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "descuentos");

            migrationBuilder.DropTable(
                name: "idempotency_keys");

            migrationBuilder.DropTable(
                name: "orden_detalle");

            migrationBuilder.DropTable(
                name: "pagos");

            migrationBuilder.DropTable(
                name: "ordenes");

            migrationBuilder.DropColumn(
                name: "cai",
                table: "empresas");

            migrationBuilder.DropColumn(
                name: "factura_actual",
                table: "empresas");

            migrationBuilder.DropColumn(
                name: "factura_fin",
                table: "empresas");

            migrationBuilder.DropColumn(
                name: "factura_inicio",
                table: "empresas");

            migrationBuilder.DropColumn(
                name: "fecha_limite_cai",
                table: "empresas");

            migrationBuilder.DropColumn(
                name: "prefijo_factura",
                table: "empresas");

            migrationBuilder.DropColumn(
                name: "rango_facturacion",
                table: "empresas");

            migrationBuilder.DropColumn(
                name: "usar_cai",
                table: "empresas");
        }
    }
}
