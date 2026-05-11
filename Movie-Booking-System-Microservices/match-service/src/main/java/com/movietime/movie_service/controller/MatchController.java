package com.movietime.movie_service.controller;

import com.movietime.movie_service.Model.CricketMatch;
import com.movietime.movie_service.Model.MatchSession;
import com.movietime.movie_service.Repository.SessionRepository;
import com.movietime.movie_service.dto.*;
import com.movietime.movie_service.service.MatchService;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/matches")
public class MatchController {
    private final MatchService service;
    private final SessionRepository sessionRepository;
    
    public MatchController(MatchService service, SessionRepository sessionRepository) { 
        this.service = service; 
        this.sessionRepository = sessionRepository;
    }

    @GetMapping
    public List<MatchDTO> list(@RequestParam(required=false) Boolean activeOnly) {
        return service.getAll(activeOnly);
    }

    @GetMapping("/{id}")
    public MatchDTO get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    public MatchDTO create(@Valid @RequestBody CreateMatchRequest req) {
        return service.create(req); 
    }

    @PutMapping("/{id}")
    public MatchDTO update(@PathVariable Long id, @RequestBody CreateMatchRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { service.delete(id); }

    @GetMapping("/{id}/sessions")
    public List<SessionDTO> showsForMovie(@PathVariable Long id) { return service.showsForMovie(id); }

    @GetMapping("/sessions/{sessionId}/details")
    public ResponseEntity<SessionDetailsDTO> getShowDetails(@PathVariable Long sessionId) {
        MatchSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("MatchSession not found"));

        SessionDetailsDTO dto = toDTO(session);
        return ResponseEntity.ok(dto);
    }

    private SessionDetailsDTO toDTO(MatchSession session) {
        SessionDetailsDTO.MatchResponse matchDTO = SessionDetailsDTO.MatchResponse.builder()
            .id(session.getMatch().getId())
            .teams(session.getMatch().getTeams())
            .tournament(session.getMatch().getTournament())
            .posterUrl(session.getMatch().getPosterUrl())
            .build();

        return SessionDetailsDTO.builder()
            .id(session.getId())
            .startTime(session.getStartTime())
            .endTime(session.getEndTime())
            .stadium(session.getStadium())
            .priceRegular(session.getPriceRegular())
            .pricePremium(session.getPricePremium())
            .match(matchDTO)
            .build();
    }
}
