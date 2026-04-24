using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using NesLab.Infrastructure.Persistence;

#nullable disable

namespace NesLab.Infrastructure.Persistence.Migrations;

/// <summary>Politica de caja por empresa: turnos/dia y caja chica.</summary>
[DbContextAttribute(typeof(NesLabDbContext))]
[Migration("20260422231000_AddCompanyCashPolicy")]
public class AddCompanyCashPolicy : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "caja_turnos_por_dia",
            table: "empresas",
            type: "int",
            nullable: false,
            defaultValue: 1);

        migrationBuilder.AddColumn<bool>(
            name: "caja_chica_habilitada",
            table: "empresas",
            type: "tinyint(1)",
            nullable: false,
            defaultValue: true);

        migrationBuilder.AddColumn<decimal>(
            name: "caja_chica_monto_sugerido",
            table: "empresas",
            type: "decimal(12,2)",
            nullable: false,
            defaultValue: 0m);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "caja_chica_monto_sugerido",
            table: "empresas");

        migrationBuilder.DropColumn(
            name: "caja_chica_habilitada",
            table: "empresas");

        migrationBuilder.DropColumn(
            name: "caja_turnos_por_dia",
            table: "empresas");
    }
}
