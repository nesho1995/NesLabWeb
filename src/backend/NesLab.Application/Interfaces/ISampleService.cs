using NesLab.Application.DTOs;

namespace NesLab.Application.Interfaces;

public interface ISampleService
{
    Task<PagedResult<SampleListItemDto>> GetSamplesAsync(
        SamplesListQuery query,
        CancellationToken cancellationToken = default);

    Task<SampleListItemDto> CreateAsync(CreateSampleRequest request, CancellationToken cancellationToken = default);

    Task<SampleListItemDto?> UpdateAsync(
        int sampleId,
        UpdateSampleRequest request,
        CancellationToken cancellationToken = default);
}
