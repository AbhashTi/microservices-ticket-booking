package com.movietime.movie_service.controller;

import com.movietime.movie_service.dto.CreateSessionRequest;
import com.movietime.movie_service.dto.SessionDTO;
import com.movietime.movie_service.dto.SessionDetailsDTO;
import com.movietime.movie_service.service.SessionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/sessions")
public class SessionController {

    private final SessionService service;
    public SessionController(SessionService service) { this.service = service; }

    @PostMapping
    public SessionDTO create(@Valid @RequestBody CreateSessionRequest req) {
        return service.create(req);
    }

    @GetMapping("/{id}")
    public SessionDetailsDTO get(@PathVariable Long id) {
        return service.get(id);
    }
}
