package com.solvence.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    private static final int MIN_KEY_BYTES = 32; // 256 bits

    private final String rawSecret;
    private final long expirationMs;
    private SecretKey signingKey;

    public JwtService(@Value("${solvence.jwt.secret:}") String rawSecret,
                      @Value("${solvence.jwt.expiration-ms:86400000}") long expirationMs) {
        this.rawSecret = rawSecret;
        this.expirationMs = expirationMs;
    }

    @PostConstruct
    public void init() {
        if (rawSecret == null || rawSecret.trim().isEmpty()) {
            throw new IllegalStateException("JWT secret configuration ('solvence.jwt.secret') must not be null or empty.");
        }

        byte[] keyBytes = rawSecret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < MIN_KEY_BYTES) {
            throw new IllegalStateException(
                    "Configured JWT secret is cryptographically insufficient. It must be at least 256 bits (32 bytes) long."
            );
        }

        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        log.info("JwtService successfully initialized with validated HMAC-SHA256 signing key.");
    }

    public String generateToken(Long userId, String email) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID must not be null for JWT token generation.");
        }
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email must not be null or empty for JWT token generation.");
        }

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(signingKey)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = parseClaims(token);
            return claims != null
                    && claims.getSubject() != null
                    && !claims.getSubject().trim().isEmpty()
                    && claims.getExpiration() != null
                    && claims.getExpiration().after(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("JWT token validation failed: {}", e.getMessage());
            return false;
        }
    }

    public Long extractUserId(String token) {
        Claims claims = parseClaims(token);
        String subject = claims.getSubject();
        if (subject == null || subject.trim().isEmpty()) {
            throw new IllegalArgumentException("Token subject is missing or empty.");
        }
        return Long.parseLong(subject);
    }

    public String extractEmail(String token) {
        Claims claims = parseClaims(token);
        return claims.get("email", String.class);
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
