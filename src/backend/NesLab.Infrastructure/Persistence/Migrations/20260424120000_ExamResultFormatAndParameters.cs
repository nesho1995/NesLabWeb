using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using NesLab.Infrastructure.Persistence;

#nullable disable

namespace NesLab.Infrastructure.Persistence.Migrations;

[DbContext(typeof(NesLabDbContext))]
[Migration("20260424120000_ExamResultFormatAndParameters")]
public class ExamResultFormatAndParameters : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "formato_resultado",
            table: "examenes",
            type: "varchar(20)",
            maxLength: 20,
            nullable: false,
            defaultValue: "texto");

        migrationBuilder.CreateTable(
            name: "examen_parametros",
            columns: table => new
            {
                id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                examen_id = table.Column<int>(type: "int", nullable: false),
                nombre = table.Column<string>(type: "varchar(120)", maxLength: 120, nullable: false),
                orden = table.Column<int>(type: "int", nullable: false),
                unidad = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true),
                referencia = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true),
                activo = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_examen_parametros", x => x.id);
                table.ForeignKey(
                    name: "FK_examen_parametros_examenes_examen_id",
                    column: x => x.examen_id,
                    principalTable: "examenes",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_examen_parametros_examen_nombre",
            table: "examen_parametros",
            columns: new[] { "examen_id", "nombre" },
            unique: true);

        migrationBuilder.AddColumn<string>(
            name: "resultado_parametros_json",
            table: "orden_detalle",
            type: "longtext",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "examen_parametros");
        migrationBuilder.DropColumn(name: "resultado_parametros_json", table: "orden_detalle");
        migrationBuilder.DropColumn(name: "formato_resultado", table: "examenes");
    }
}
