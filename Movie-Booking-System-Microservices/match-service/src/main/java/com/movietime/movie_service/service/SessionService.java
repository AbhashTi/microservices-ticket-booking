package com.movietime.movie_service.service;

import com.movietime.movie_service.dto.CreateSessionRequest;
import com.movietime.movie_service.dto.SessionDTO;
import com.movietime.movie_service.dto.SessionDetailsDTO;

public interface SessionService {
    SessionDTO create(CreateSessionRequest request);
    SessionDetailsDTO get(Long id);
}
