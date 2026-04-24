using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using NesLab.Infrastructure.Persistence;

#nullable disable

namespace NesLab.Infrastructure.Persistence.Migrations;

[DbContextAttribute(typeof(NesLabDbContext))]
[Migration("20260422240000_AddPaymentMethodCatalog")]
public class AddPaymentMethodCatalog : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "formas_pago",
            columns: table => new
            {
                id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                empresa_id = table.Column<int>(type: "int", nullable: false),
                codigo = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                    .Annotation("MySql:CharSet", "utf8mb4"),
                nombre = table.Column<string>(type: "varchar(80)", maxLength: 80, nullable: false)
                    .Annotation("MySql:CharSet", "utf8mb4"),
                orden_lista = table.Column<int>(type: "int", nullable: false),
                activo = table.Column<bool>(type: "tinyint(1)", nullable: false),
                caja_fisica = table.Column<bool>(type: "tinyint(1)", nullable: false),
                monto_recibido = table.Column<bool>(type: "tinyint(1)", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_formas_pago", x => x.id);
                table.ForeignKey(
                    name: "FK_formas_pago_empresas_empresa_id",
                    column: x => x.empresa_id,
                    principalTable: "empresas",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            })
            .Annotation("MySql:CharSet", "utf8mb4");

        migrationBuilder.CreateIndex(
            name: "IX_formas_pago_empresa_id_codigo",
            table: "formas_pago",
            columns: new[] { "empresa_id", "codigo" },
            unique: true);

        migrationBuilder.Sql(
            """
            INSERT INTO formas_pago (empresa_id, codigo, nombre, orden_lista, activo, caja_fisica, monto_recibido)
            SELECT e.id, 'EFECTIVO', 'Efectivo', 0, 1, 1, 1 FROM empresas e
            WHERE NOT EXISTS (SELECT 1 FROM formas_pago f WHERE f.empresa_id = e.id AND f.codigo = 'EFECTIVO' LIMIT 1);
            """);
        migrationBuilder.Sql(
            """
            INSERT INTO formas_pago (empresa_id, codigo, nombre, orden_lista, activo, caja_fisica, monto_recibido)
            SELECT e.id, 'TARJETA', 'Tarjeta', 10, 1, 0, 0 FROM empresas e
            WHERE NOT EXISTS (SELECT 1 FROM formas_pago f WHERE f.empresa_id = e.id AND f.codigo = 'TARJETA' LIMIT 1);
            """);
        migrationBuilder.Sql(
            """
            INSERT INTO formas_pago (empresa_id, codigo, nombre, orden_lista, activo, caja_fisica, monto_recibido)
            SELECT e.id, 'TRANSFERENCIA', 'Transferencia', 20, 1, 0, 0 FROM empresas e
            WHERE NOT EXISTS (SELECT 1 FROM formas_pago f WHERE f.empresa_id = e.id AND f.codigo = 'TRANSFERENCIA' LIMIT 1);
            """);
        migrationBuilder.Sql(
            """
            INSERT INTO formas_pago (empresa_id, codigo, nombre, orden_lista, activo, caja_fisica, monto_recibido)
            SELECT e.id, 'OTRO', 'Otro', 30, 1, 0, 0 FROM empresas e
            WHERE NOT EXISTS (SELECT 1 FROM formas_pago f WHERE f.empresa_id = e.id AND f.codigo = 'OTRO' LIMIT 1);
            """);

        migrationBuilder.AddColumn<int>(
            name: "forma_pago_id",
            table: "pagos",
            type: "int",
            nullable: true);

        migrationBuilder.Sql(
            """
            UPDATE pagos p
            INNER JOIN ordenes o ON o.id = p.orden_id
            INNER JOIN formas_pago f ON f.empresa_id = o.empresa_id AND f.codigo = 
              CASE
                WHEN p.metodo = 'Efectivo' THEN 'EFECTIVO'
                WHEN p.metodo = 'Tarjeta' THEN 'TARJETA'
                WHEN p.metodo = 'Transferencia' THEN 'TRANSFERENCIA'
                WHEN p.metodo = 'Otro' THEN 'OTRO'
                ELSE 'OTRO'
              END
            SET p.forma_pago_id = f.id;
            """);

        migrationBuilder.CreateIndex(
            name: "IX_pagos_forma_pago_id",
            table: "pagos",
            column: "forma_pago_id");

        migrationBuilder.AddForeignKey(
            name: "FK_pagos_formas_pago_forma_pago_id",
            table: "pagos",
            column: "forma_pago_id",
            principalTable: "formas_pago",
            principalColumn: "id",
            onDelete: ReferentialAction.SetNull);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(name: "FK_pagos_formas_pago_forma_pago_id", table: "pagos");
        migrationBuilder.DropIndex(name: "IX_pagos_forma_pago_id", table: "pagos");
        migrationBuilder.DropColumn(name: "forma_pago_id", table: "pagos");
        migrationBuilder.DropTable(name: "formas_pago");
    }
}
