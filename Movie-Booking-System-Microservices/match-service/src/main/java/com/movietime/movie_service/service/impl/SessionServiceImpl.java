package com.movietime.movie_service.service.impl;

import com.movietime.movie_service.dto.*;
import com.movietime.movie_service.Model.*;
import com.movietime.movie_service.Repository.*;
import com.movietime.movie_service.exception.NotFoundException;
import com.movietime.movie_service.service.SessionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional
public class SessionServiceImpl implements SessionService {
    private final SessionRepository sessions;
    private final MatchRepository matches;

    public SessionServiceImpl(SessionRepository sessions, MatchRepository matches) {
        this.sessions = sessions; this.matches = matches;
    }

    @Override
    public SessionDTO create(CreateSessionRequest req) {
        CricketMatch match = matches.findById(req.getMatchId())
                .orElseThrow(() -> new NotFoundException("CricketMatch not found: " + req.getMatchId()));
        MatchSession s = MatchSession.builder()
                .match(match)
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .stadium(req.getStadium())
                .priceRegular(req.getPriceRegular())
                .pricePremium(req.getPricePremium())
                .build();
        return toDto(sessions.save(s));
    }

    @Override
    public SessionDetailsDTO get(Long id) {
        return sessions.findById(id).map(s -> {
            SessionDetailsDTO.MatchResponse mr = SessionDetailsDTO.MatchResponse.builder()
                    .id(s.getMatch().getId()).teams(s.getMatch().getTeams())
                    .tournament(s.getMatch().getTournament())
                    .posterUrl(s.getMatch().getPosterUrl()).build();
            return SessionDetailsDTO.builder()
                    .id(s.getId()).match(mr)
                    .startTime(s.getStartTime()).endTime(s.getEndTime())
                    .stadium(s.getStadium())
                    .priceRegular(s.getPriceRegular())
                    .pricePremium(s.getPricePremium())
                    .build();
        }).orElseThrow(() -> new NotFoundException("MatchSession not found: " + id));
    }

    private SessionDTO toDto(MatchSession s) {
        return new SessionDTO(s.getId(), s.getMatch().getId(), s.getMatch().getTeams(),
                s.getStartTime(), s.getEndTime(), s.getStadium(),
                s.getPriceRegular(), s.getPricePremium());
    }
}
