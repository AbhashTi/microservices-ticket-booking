package com.movietime.movie_service.Model;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;

@Entity
@Table(name = "matches")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CricketMatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String teams; // e.g. "India vs Australia"

    @Column(length = 2000)
    private String description;

    private String format; // e.g. "T20", "ODI", "Test"
    private String tournament; // e.g. "World Cup"
    private String stadiumName;
    private String posterUrl;
    private LocalDate matchDate;

    @Builder.Default
    private boolean active = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (this.createdAt == null) this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
