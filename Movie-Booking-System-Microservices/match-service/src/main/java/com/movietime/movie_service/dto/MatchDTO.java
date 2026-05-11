package com.movietime.movie_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchDTO {
    public Long id;
    public String teams;
    public String description;
    public String format;
    public String tournament;
    public String stadiumName;
    public String posterUrl;
    public LocalDate matchDate;
    public boolean active;
}
