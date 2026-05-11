package com.movietime.movie_service.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateMatchRequest {
    @NotBlank(message = "Teams name is required")
    private String teams;

    private String description;
    
    @NotBlank(message = "Format is required")
    private String format;

    @NotBlank(message = "Tournament is required")
    private String tournament;
    
    private String stadiumName;

    private String posterUrl;
    
    private LocalDate matchDate;
}
