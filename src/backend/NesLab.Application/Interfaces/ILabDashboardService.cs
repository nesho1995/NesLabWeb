using NesLab.Application.DTOs;

namespace NesLab.Application.Interfaces;

public interface ILabDashboardService
{
    Task<LabDashboardDto> GetAsync(CancellationToken cancellationToken = default);
    Task<FinanceSummaryDto> GetFinanceSummaryAsync(DateOnly? fromDate, DateOnly? toDate, CancellationToken cancellationToken = default);
}
