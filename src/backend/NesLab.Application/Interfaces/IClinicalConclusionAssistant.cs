using NesLab.Application.DTOs;

namespace NesLab.Application.Interfaces;

public interface IClinicalConclusionAssistant
{
    Task<SuggestConclusionResponseDto> SuggestAsync(
        SuggestConclusionRequestDto request,
        CancellationToken cancellationToken = default);
}
