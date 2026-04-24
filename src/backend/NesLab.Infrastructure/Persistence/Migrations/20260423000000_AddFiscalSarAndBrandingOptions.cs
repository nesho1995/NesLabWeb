using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NesLab.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFiscalSarAndBrandingOptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "permitir_doc_sin_sar",
                table: "empresas",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "prefijo_doc_interno",
                table: "empresas",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "REC");

            migrationBuilder.AddColumn<int>(
                name: "doc_interno_actual",
                table: "empresas",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "fiscal_marca_json",
                table: "empresas",
                type: "longtext",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "fiscal_marca_json",
                table: "empresas");

            migrationBuilder.DropColumn(
                name: "doc_interno_actual",
                table: "empresas");

            migrationBuilder.DropColumn(
                name: "prefijo_doc_interno",
                table: "empresas");

            migrationBuilder.DropColumn(
                name: "permitir_doc_sin_sar",
                table: "empresas");
        }
    }
}
