package com.movietime.movie_service.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class SessionDetailsDTO {
    private Long id;
    private MatchResponse match;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String stadium;
    private Integer priceRegular;
    private Integer pricePremium;

    @Data
    @Builder
    public static class MatchResponse {
        private Long id;
        private String teams;
        private String tournament;
        private String posterUrl;
    }
}
