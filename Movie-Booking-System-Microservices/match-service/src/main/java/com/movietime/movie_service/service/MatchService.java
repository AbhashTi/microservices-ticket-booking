package com.movietime.movie_service.service;

import com.movietime.movie_service.Model.CricketMatch;
import com.movietime.movie_service.dto.*;
import java.util.List;

public interface MatchService {
    List<MatchDTO> getAll(Boolean onlyActive);
    MatchDTO get(Long id);
    MatchDTO create(CreateMatchRequest req);
    MatchDTO update(Long id, CreateMatchRequest req);
    void delete(Long id);
    List<SessionDTO> showsForMovie(Long matchId);
}
