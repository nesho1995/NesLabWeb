using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NesLab.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PendingModelSync : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // This migration was generated before examen_parametros was created by
            // 20260424120000_ExamResultFormatAndParameters. Keep it as a no-op so a
            // brand-new database can apply the migration chain in timestamp order.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No-op; the table does not exist at this point in the migration chain.
        }
    }
}
