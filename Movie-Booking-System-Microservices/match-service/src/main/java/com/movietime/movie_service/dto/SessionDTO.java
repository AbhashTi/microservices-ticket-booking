package com.movietime.movie_service.dto;

import java.time.LocalDateTime;

public record SessionDTO(
        Long id,
        Long matchId,
        String movieTitle,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String stadium,
        Integer priceRegular,
        Integer pricePremium
) {}
