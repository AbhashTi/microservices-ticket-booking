package com.movietime.movie_service.Repository;

import com.movietime.movie_service.Model.CricketMatch;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchRepository extends JpaRepository<CricketMatch, Long> {}
