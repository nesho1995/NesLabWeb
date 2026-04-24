using NesLab.Application.DTOs;

namespace NesLab.Application.Interfaces;

public interface ILabExamService
{
    Task<PagedResult<LabExamListItemDto>> GetPagedAsync(LabExamListQuery query, CancellationToken cancellationToken);
    Task<LabExamDetailDto?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<LabExamDetailDto> CreateAsync(CreateLabExamRequest request, CancellationToken cancellationToken);
    Task<LabExamDetailDto?> UpdateAsync(int id, UpdateLabExamRequest request, CancellationToken cancellationToken);
    Task<BulkImportLabExamsResult> BulkImportAsync(
        BulkImportLabExamsRequest request,
        CancellationToken cancellationToken = default);
    Task<ClearLabExamsCatalogResult> ClearCatalogAsync(CancellationToken cancellationToken = default);
    Task<ApplyExamTemplatesResult> ApplyDefaultTemplatesAsync(CancellationToken cancellationToken = default);
}
