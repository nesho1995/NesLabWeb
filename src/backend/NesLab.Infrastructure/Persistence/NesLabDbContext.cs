using Microsoft.EntityFrameworkCore;
using NesLab.Domain.Entities;

namespace NesLab.Infrastructure.Persistence;

public sealed class NesLabDbContext(DbContextOptions<NesLabDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<LabExam> LabExams => Set<LabExam>();
    public DbSet<LabExamParameter> LabExamParameters => Set<LabExamParameter>();
    public DbSet<LabOrder> Orders => Set<LabOrder>();
    public DbSet<OrderLine> OrderLines => Set<OrderLine>();
    public DbSet<LabSample> LabSamples => Set<LabSample>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<DiscountCatalog> Discounts => Set<DiscountCatalog>();
    public DbSet<IdempotencyRecord> IdempotencyKeys => Set<IdempotencyRecord>();
    public DbSet<CashSession> CashSessions => Set<CashSession>();
    public DbSet<CompanyPaymentMethod> CompanyPaymentMethods => Set<CompanyPaymentMethod>();
    public DbSet<ReagentStock> ReagentStocks => Set<ReagentStock>();
    public DbSet<OfflineSyncRegularization> OfflineSyncRegularizations => Set<OfflineSyncRegularization>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.Username).HasColumnName("username").HasMaxLength(100);
            entity.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(200);
            entity.Property(x => x.PasswordHash).HasColumnName("password_hash").HasMaxLength(500);
            entity.Property(x => x.PasswordAlgorithm).HasColumnName("password_algorithm").HasMaxLength(20);
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
            entity.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");
            entity.HasIndex(x => x.Username).IsUnique();
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("roles");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.Code).HasColumnName("code").HasMaxLength(60);
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(120);
            entity.HasIndex(x => x.Code).IsUnique();
        });

        modelBuilder.Entity<Permission>(entity =>
        {
            entity.ToTable("permissions");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.Code).HasColumnName("code").HasMaxLength(100);
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(120);
            entity.HasIndex(x => x.Code).IsUnique();
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.ToTable("user_roles");
            entity.HasKey(x => new { x.UserId, x.RoleId });
            entity.Property(x => x.UserId).HasColumnName("user_id");
            entity.Property(x => x.RoleId).HasColumnName("role_id");
        });

        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.ToTable("role_permissions");
            entity.HasKey(x => new { x.RoleId, x.PermissionId });
            entity.Property(x => x.RoleId).HasColumnName("role_id");
            entity.Property(x => x.PermissionId).HasColumnName("permission_id");
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("refresh_tokens");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.UserId).HasColumnName("user_id");
            entity.Property(x => x.TokenHash).HasColumnName("token_hash").HasMaxLength(128);
            entity.Property(x => x.ExpiresAtUtc).HasColumnName("expires_at_utc");
            entity.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
            entity.Property(x => x.RevokedAtUtc).HasColumnName("revoked_at_utc");
            entity.HasIndex(x => x.TokenHash).IsUnique();
        });

        modelBuilder.Entity<UserRole>()
            .HasOne(x => x.User)
            .WithMany(x => x.UserRoles)
            .HasForeignKey(x => x.UserId);

        modelBuilder.Entity<UserRole>()
            .HasOne(x => x.Role)
            .WithMany(x => x.UserRoles)
            .HasForeignKey(x => x.RoleId);

        modelBuilder.Entity<RolePermission>()
            .HasOne(x => x.Role)
            .WithMany(x => x.RolePermissions)
            .HasForeignKey(x => x.RoleId);

        modelBuilder.Entity<RolePermission>()
            .HasOne(x => x.Permission)
            .WithMany(x => x.RolePermissions)
            .HasForeignKey(x => x.PermissionId);

        modelBuilder.Entity<RefreshToken>()
            .HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId);

        modelBuilder.Entity<Company>(entity =>
        {
            entity.ToTable("empresas");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.Name).HasColumnName("nombre").HasMaxLength(200);
            entity.Property(x => x.Rtn).HasColumnName("rtn").HasMaxLength(20);
            entity.Property(x => x.Address).HasColumnName("direccion").HasMaxLength(300);
            entity.Property(x => x.Phone).HasColumnName("telefono").HasMaxLength(50);
            entity.Property(x => x.IsActive).HasColumnName("activo");
            entity.Property(x => x.CreatedAtUtc).HasColumnName("creado_en_utc");
            entity.Property(x => x.InvoicePrefix).HasColumnName("prefijo_factura").HasMaxLength(20).HasDefaultValue("INT");
            entity.Property(x => x.InvoiceStart).HasColumnName("factura_inicio");
            entity.Property(x => x.InvoiceEnd).HasColumnName("factura_fin");
            entity.Property(x => x.InvoiceCurrent).HasColumnName("factura_actual");
            entity.Property(x => x.Cai).HasColumnName("cai").HasMaxLength(100);
            entity.Property(x => x.InvoiceRangeLabel).HasColumnName("rango_facturacion").HasMaxLength(200);
            entity.Property(x => x.CaiDueDate).HasColumnName("fecha_limite_cai").HasColumnType("datetime(6)");
            entity.Property(x => x.UseCai).HasColumnName("usar_cai").HasDefaultValue(false);
            entity.Property(x => x.AllowNonSarDocument).HasColumnName("permitir_doc_sin_sar").HasDefaultValue(false);
            entity.Property(x => x.InternalDocPrefix).HasColumnName("prefijo_doc_interno").HasMaxLength(20).HasDefaultValue("REC");
            entity.Property(x => x.InternalDocCurrent).HasColumnName("doc_interno_actual");
            entity.Property(x => x.FiscalBrandingJson).HasColumnName("fiscal_marca_json").HasColumnType("longtext");
            entity.Property(x => x.CashShiftsPerDay).HasColumnName("caja_turnos_por_dia").HasDefaultValue(1);
            entity.Property(x => x.CashPettyCashEnabled).HasColumnName("caja_chica_habilitada").HasDefaultValue(true);
            entity.Property(x => x.CashPettyCashDefault).HasColumnName("caja_chica_monto_sugerido").HasColumnType("decimal(12,2)").HasDefaultValue(0m);
        });

        modelBuilder.Entity<Patient>(entity =>
        {
            entity.ToTable("pacientes");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.CompanyId).HasColumnName("empresa_id");
            entity.Property(x => x.FullName).HasColumnName("nombre").HasMaxLength(200);
            entity.Property(x => x.NationalId).HasColumnName("identidad").HasMaxLength(50);
            entity.Property(x => x.Phone).HasColumnName("telefono").HasMaxLength(50);
            entity.Property(x => x.IsActive).HasColumnName("activo");
            entity.Property(x => x.RegisteredAtUtc).HasColumnName("registrado_en_utc");
            entity.Property(x => x.UpdatedAtUtc).HasColumnName("actualizado_en_utc");
            entity.HasIndex(x => new { x.CompanyId, x.NationalId });
            entity.HasIndex(x => new { x.CompanyId, x.FullName });
        });

        modelBuilder.Entity<LabExam>(entity =>
        {
            entity.ToTable("examenes");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.CompanyId).HasColumnName("empresa_id");
            entity.Property(x => x.Code).HasColumnName("codigo").HasMaxLength(40);
            entity.Property(x => x.Name).HasColumnName("nombre").HasMaxLength(200);
            entity.Property(x => x.Price).HasColumnName("precio").HasColumnType("decimal(12,2)");
            entity.Property(x => x.IsActive).HasColumnName("activo");
            entity.Property(x => x.ResultFormat).HasColumnName("formato_resultado").HasMaxLength(20).HasDefaultValue("texto");
            entity.Property(x => x.CreatedAtUtc).HasColumnName("creado_en_utc");
            entity.Property(x => x.UpdatedAtUtc).HasColumnName("actualizado_en_utc");
            entity.HasIndex(x => new { x.CompanyId, x.Code });
            entity.HasIndex(x => new { x.CompanyId, x.Name });
        });

        modelBuilder.Entity<LabExamParameter>(entity =>
        {
            entity.ToTable("examen_parametros");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.LabExamId).HasColumnName("examen_id");
            entity.Property(x => x.Name).HasColumnName("nombre").HasMaxLength(120);
            entity.Property(x => x.SortOrder).HasColumnName("orden");
            entity.Property(x => x.Unit).HasColumnName("unidad").HasMaxLength(50);
            entity.Property(x => x.ReferenceText).HasColumnName("referencia").HasMaxLength(200);
            entity.Property(x => x.IsActive).HasColumnName("activo");
            entity.HasIndex(x => new { x.LabExamId, x.Name }).IsUnique();
        });

        modelBuilder.Entity<Patient>()
            .HasOne(x => x.Company)
            .WithMany(x => x.Patients)
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LabExam>()
            .HasOne(x => x.Company)
            .WithMany(x => x.LabExams)
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LabExamParameter>()
            .HasOne(x => x.LabExam)
            .WithMany(x => x.Parameters)
            .HasForeignKey(x => x.LabExamId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<LabOrder>(entity =>
        {
            entity.ToTable("ordenes");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.CompanyId).HasColumnName("empresa_id");
            entity.Property(x => x.PatientId).HasColumnName("paciente_id");
            entity.Property(x => x.InvoiceNumber).HasColumnName("numero_factura").HasMaxLength(40);
            entity.Property(x => x.OrderAtUtc).HasColumnName("fecha").HasColumnType("datetime(6)");
            entity.Property(x => x.SubtotalBase).HasColumnName("subtotal").HasColumnType("decimal(12,2)");
            entity.Property(x => x.DiscountPercent).HasColumnName("descuento_porcentaje").HasColumnType("decimal(5,2)");
            entity.Property(x => x.DiscountAmount).HasColumnName("descuento_monto").HasColumnType("decimal(12,2)");
            entity.Property(x => x.Isv).HasColumnName("isv").HasColumnType("decimal(12,2)");
            entity.Property(x => x.Total).HasColumnName("total_final").HasColumnType("decimal(12,2)");
            entity.Property(x => x.DiscountTypeLabel).HasColumnName("tipo_descuento").HasMaxLength(120);
            entity.Property(x => x.Status).HasColumnName("estado").HasMaxLength(50);
            entity.Property(x => x.ClientInvoiceName).HasColumnName("nombre_factura_cliente").HasMaxLength(200);
            entity.Property(x => x.ClientRtn).HasColumnName("rtn_cliente").HasMaxLength(20);
            entity.Property(x => x.CaiSnapshot).HasColumnName("cai_resumen").HasMaxLength(100);
            entity.Property(x => x.RangeSnapshot).HasColumnName("rango_resumen").HasMaxLength(200);
            entity.Property(x => x.CaiDueDateSnapshot).HasColumnName("cai_venc_resumen").HasColumnType("datetime(6)");
            entity.Property(x => x.CaiMode).HasColumnName("cai_activa");
            entity.Property(x => x.CreatedByUserId).HasColumnName("creado_por_usuario_id");
            entity.HasIndex(x => new { x.CompanyId, x.InvoiceNumber }).IsUnique();
            entity.HasIndex(x => new { x.CompanyId, x.OrderAtUtc });
        });

        modelBuilder.Entity<OrderLine>(entity =>
        {
            entity.ToTable("orden_detalle");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.OrderId).HasColumnName("orden_id");
            entity.Property(x => x.LabExamId).HasColumnName("examen_id");
            entity.Property(x => x.ExamName).HasColumnName("examen_nombre").HasMaxLength(200);
            entity.Property(x => x.BasePrice).HasColumnName("precio_base").HasColumnType("decimal(12,2)");
            entity.Property(x => x.LineDiscountPercent).HasColumnName("descuento_linea").HasColumnType("decimal(5,2)");
            entity.Property(x => x.LineTotal).HasColumnName("precio").HasColumnType("decimal(12,2)");
            entity.Property(x => x.ResultNotes).HasColumnName("resultado_notas").HasMaxLength(2000);
            entity.Property(x => x.ResultParametersJson).HasColumnName("resultado_parametros_json").HasColumnType("longtext");
            entity.Property(x => x.ValidatedAtUtc).HasColumnName("validado_en_utc").HasColumnType("datetime(6)");
            entity.Property(x => x.ValidatedByUserId).HasColumnName("validado_por_usuario_id");
        });

        modelBuilder.Entity<LabSample>(entity =>
        {
            entity.ToTable("muestras");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.CompanyId).HasColumnName("empresa_id");
            entity.Property(x => x.OrderId).HasColumnName("orden_id");
            entity.Property(x => x.Code).HasColumnName("codigo").HasMaxLength(50);
            entity.Property(x => x.Notes).HasColumnName("notas").HasMaxLength(2000);
            entity.Property(x => x.CollectedAtUtc).HasColumnName("tomada_en_utc").HasColumnType("datetime(6)");
            entity.Property(x => x.CreatedByUserId).HasColumnName("creado_por_usuario_id");
            entity.Property(x => x.CreatedAtUtc).HasColumnName("creado_en_utc").HasColumnType("datetime(6)");
            entity.HasIndex(x => new { x.CompanyId, x.Code }).IsUnique();
            entity.HasIndex(x => new { x.CompanyId, x.OrderId });
        });

        modelBuilder.Entity<CompanyPaymentMethod>(entity =>
        {
            entity.ToTable("formas_pago");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.CompanyId).HasColumnName("empresa_id");
            entity.Property(x => x.Code).HasColumnName("codigo").HasMaxLength(20);
            entity.Property(x => x.Name).HasColumnName("nombre").HasMaxLength(80);
            entity.Property(x => x.SortOrder).HasColumnName("orden_lista");
            entity.Property(x => x.IsActive).HasColumnName("activo");
            entity.Property(x => x.InPhysicalDrawer).HasColumnName("caja_fisica");
            entity.Property(x => x.RequiresAmountReceived).HasColumnName("monto_recibido");
            entity.HasIndex(x => new { x.CompanyId, x.Code }).IsUnique();
        });

        modelBuilder.Entity<ReagentStock>(entity =>
        {
            entity.ToTable("inventario_reactivos");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.CompanyId).HasColumnName("empresa_id");
            entity.Property(x => x.Code).HasColumnName("codigo").HasMaxLength(30);
            entity.Property(x => x.Name).HasColumnName("nombre").HasMaxLength(120);
            entity.Property(x => x.Unit).HasColumnName("unidad").HasMaxLength(20);
            entity.Property(x => x.CurrentStock).HasColumnName("existencia").HasColumnType("decimal(14,3)");
            entity.Property(x => x.MinimumStock).HasColumnName("minimo").HasColumnType("decimal(14,3)");
            entity.Property(x => x.IsActive).HasColumnName("activo");
            entity.Property(x => x.UpdatedAtUtc).HasColumnName("actualizado_en_utc").HasColumnType("datetime(6)");
            entity.HasIndex(x => new { x.CompanyId, x.Code }).IsUnique();
            entity.HasIndex(x => new { x.CompanyId, x.IsActive });
        });

        modelBuilder.Entity<OfflineSyncRegularization>(entity =>
        {
            entity.ToTable("offline_sync_regularizaciones");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.CompanyId).HasColumnName("empresa_id");
            entity.Property(x => x.TempId).HasColumnName("temp_id").HasMaxLength(80);
            entity.Property(x => x.OrderId).HasColumnName("orden_id");
            entity.Property(x => x.InvoiceNumber).HasColumnName("numero_factura").HasMaxLength(60);
            entity.Property(x => x.CaiMode).HasColumnName("cai_mode");
            entity.Property(x => x.RequestedCai).HasColumnName("solicito_cai");
            entity.Property(x => x.PatientName).HasColumnName("paciente_nombre").HasMaxLength(200);
            entity.Property(x => x.Source).HasColumnName("fuente").HasMaxLength(40);
            entity.Property(x => x.RegularizedAtUtc).HasColumnName("regularizado_en_utc").HasColumnType("datetime(6)");
            entity.HasIndex(x => new { x.CompanyId, x.RegularizedAtUtc });
            entity.HasIndex(x => new { x.CompanyId, x.TempId, x.OrderId }).IsUnique();
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.ToTable("pagos");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.OrderId).HasColumnName("orden_id");
            entity.Property(x => x.CompanyPaymentMethodId).HasColumnName("forma_pago_id");
            entity.Property(x => x.Method).HasColumnName("metodo").HasMaxLength(50);
            entity.Property(x => x.Amount).HasColumnName("monto").HasColumnType("decimal(12,2)");
            entity.Property(x => x.PaidAtUtc).HasColumnName("fecha").HasColumnType("datetime(6)");
        });

        modelBuilder.Entity<DiscountCatalog>(entity =>
        {
            entity.ToTable("descuentos");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.CompanyId).HasColumnName("empresa_id");
            entity.Property(x => x.Name).HasColumnName("nombre").HasMaxLength(100);
            entity.Property(x => x.Percent).HasColumnName("porcentaje").HasColumnType("decimal(5,2)");
            entity.Property(x => x.IsActive).HasColumnName("activo");
            entity.Property(x => x.SortOrder).HasColumnName("orden_lista");
        });

        modelBuilder.Entity<IdempotencyRecord>(entity =>
        {
            entity.ToTable("idempotency_keys");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.UserId).HasColumnName("user_id");
            entity.Property(x => x.KeyHash).HasColumnName("key_hash").HasMaxLength(64);
            entity.Property(x => x.OrderId).HasColumnName("orden_id");
            entity.Property(x => x.CreatedAtUtc).HasColumnName("creado_en_utc").HasColumnType("datetime(6)");
            entity.Property(x => x.ExpiresAtUtc).HasColumnName("expira_en_utc").HasColumnType("datetime(6)");
            entity.HasIndex(x => new { x.UserId, x.KeyHash }).IsUnique();
        });

        modelBuilder.Entity<CashSession>(entity =>
        {
            entity.ToTable("caja_sesiones");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.CompanyId).HasColumnName("empresa_id");
            entity.Property(x => x.OpenedAtUtc).HasColumnName("apertura_en_utc").HasColumnType("datetime(6)");
            entity.Property(x => x.ClosedAtUtc).HasColumnName("cierre_en_utc").HasColumnType("datetime(6)");
            entity.Property(x => x.OpenedByUserId).HasColumnName("usuario_apertura_id");
            entity.Property(x => x.ClosedByUserId).HasColumnName("usuario_cierre_id");
            entity.Property(x => x.PettyCashOpening).HasColumnName("caja_chica_inicial").HasColumnType("decimal(12,2)");
            entity.Property(x => x.DeclaredClosingCash).HasColumnName("declarado_cierre").HasColumnType("decimal(12,2)");
            entity.Property(x => x.ExpectedClosingCash).HasColumnName("esperado_cierre").HasColumnType("decimal(12,2)");
            entity.Property(x => x.DifferenceClosing).HasColumnName("diferencia_cierre").HasColumnType("decimal(12,2)");
            entity.Property(x => x.CloseNotes).HasColumnName("notas_cierre").HasMaxLength(500);
            entity.HasIndex(x => new { x.CompanyId, x.ClosedAtUtc });
        });

        modelBuilder.Entity<LabOrder>()
            .HasOne(x => x.Company)
            .WithMany(x => x.Orders)
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LabOrder>()
            .HasOne(x => x.Patient)
            .WithMany()
            .HasForeignKey(x => x.PatientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LabOrder>()
            .HasOne(x => x.CreatedBy)
            .WithMany()
            .HasForeignKey(x => x.CreatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<OrderLine>()
            .HasOne(x => x.Order)
            .WithMany(x => x.Lines)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderLine>()
            .HasOne(x => x.LabExam)
            .WithMany()
            .HasForeignKey(x => x.LabExamId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<OrderLine>()
            .HasOne(x => x.ValidatedBy)
            .WithMany()
            .HasForeignKey(x => x.ValidatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Payment>()
            .HasOne(x => x.Order)
            .WithMany(x => x.Payments)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CompanyPaymentMethod>()
            .HasOne(x => x.Company)
            .WithMany()
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ReagentStock>()
            .HasOne(x => x.Company)
            .WithMany()
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<OfflineSyncRegularization>()
            .HasOne(x => x.Company)
            .WithMany()
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<OfflineSyncRegularization>()
            .HasOne(x => x.Order)
            .WithMany()
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Payment>()
            .HasOne(x => x.CompanyPaymentMethod)
            .WithMany(x => x.Payments)
            .HasForeignKey(x => x.CompanyPaymentMethodId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<LabSample>()
            .HasOne(x => x.Company)
            .WithMany(c => c.LabSamples)
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LabSample>()
            .HasOne(x => x.Order)
            .WithMany(x => x.Samples)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<LabSample>()
            .HasOne(x => x.CreatedBy)
            .WithMany()
            .HasForeignKey(x => x.CreatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<DiscountCatalog>()
            .HasOne(x => x.Company)
            .WithMany()
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<IdempotencyRecord>()
            .HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<IdempotencyRecord>()
            .HasOne(x => x.Order)
            .WithMany()
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<CashSession>()
            .HasOne(x => x.Company)
            .WithMany()
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CashSession>()
            .HasOne(x => x.OpenedBy)
            .WithMany()
            .HasForeignKey(x => x.OpenedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CashSession>()
            .HasOne(x => x.ClosedBy)
            .WithMany()
            .HasForeignKey(x => x.ClosedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
