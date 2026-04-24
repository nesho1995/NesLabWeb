using NesLab.Application.DTOs;

namespace NesLab.Application.Interfaces;

public interface IPatientService
{
    Task<PagedResult<PatientListItemDto>> GetPagedAsync(PatientListQuery query, CancellationToken cancellationToken);
    Task<PatientDetailDto?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<PatientDetailDto> CreateAsync(CreatePatientRequest request, CancellationToken cancellationToken);
    Task<PatientDetailDto?> UpdateAsync(int id, UpdatePatientRequest request, CancellationToken cancellationToken);
}
