package com.movietime.movie_service.Repository;

import com.movietime.movie_service.Model.MatchSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface SessionRepository extends JpaRepository<MatchSession, Long> {
    List<MatchSession> findByMatch_Id(Long matchId);
    List<MatchSession> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
}
