package com.movietime.movie_service.service.impl;

import com.movietime.movie_service.dto.*;
import com.movietime.movie_service.Model.*;
import com.movietime.movie_service.Repository.*;
import com.movietime.movie_service.exception.NotFoundException;
import com.movietime.movie_service.service.MatchService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service @Transactional
public class MatchServiceImpl implements MatchService {
    private final MatchRepository matches;
    private final SessionRepository sessions;

    public MatchServiceImpl(MatchRepository matches, SessionRepository sessions) {
        this.matches = matches; this.sessions = sessions;
    }

    @Override
    public List<MatchDTO> getAll(Boolean onlyActive) {
        return matches.findAll().stream()
                .filter(m -> onlyActive == null || !onlyActive || m.isActive())
                .map(this::toDto).toList();
    }

    @Override
    public MatchDTO get(Long id) {
        return matches.findById(id).map(this::toDto)
                .orElseThrow(() -> new NotFoundException("CricketMatch not found: " + id));
    }

    @Override
    public MatchDTO create(CreateMatchRequest r) {
        CricketMatch m = CricketMatch.builder()
                .teams(r.getTeams())
                .description(r.getDescription())
                .format(r.getFormat())
                .tournament(r.getTournament())
                .stadiumName(r.getStadiumName())
                .posterUrl(r.getPosterUrl())
                .matchDate(r.getMatchDate())
                .active(true)
                .build();
        System.out.println("Saving match: " + m.getTeams());
        // persist and return the saved entity so id and timestamps are generated
        return toDto(matches.save(m));
    }

    @Override
    public MatchDTO update(Long id, CreateMatchRequest r) {
        CricketMatch m = matches.findById(id)
                .orElseThrow(() -> new NotFoundException("CricketMatch not found: " + id));
        if (r.getTeams() != null) m.setTeams(r.getTeams());
        if (r.getDescription() != null) m.setDescription(r.getDescription());
        if (r.getFormat() != null) m.setFormat(r.getFormat());
        if (r.getTournament() != null) m.setTournament(r.getTournament());
        if (r.getStadiumName() != null) m.setStadiumName(r.getStadiumName());
        if (r.getPosterUrl() != null) m.setPosterUrl(r.getPosterUrl());
        if (r.getMatchDate() != null) m.setMatchDate(r.getMatchDate());
        
        return toDto(m);
    }

    @Override
    public void delete(Long id) { matches.deleteById(id); }

    @Override
    public List<SessionDTO> showsForMovie(Long matchId) {
        return sessions.findByMatch_Id(matchId).stream().map(this::toDto).toList();
    }

    private MatchDTO toDto(CricketMatch m) {
        return new MatchDTO(
            m.getId(), m.getTeams(), m.getDescription(),
            m.getFormat(), m.getTournament(), m.getStadiumName(),
            m.getPosterUrl(), m.getMatchDate(), m.isActive()
        );
    }

    private SessionDTO toDto(MatchSession s) {
        return new SessionDTO(
            s.getId(), s.getMatch().getId(), s.getMatch().getTeams(),
            s.getStartTime(), s.getEndTime(), s.getStadium(),
            s.getPriceRegular(), s.getPricePremium()
        );
    }
}
