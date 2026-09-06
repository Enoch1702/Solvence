package com.solvence.service;

import com.solvence.dto.AuthResponse;
import com.solvence.dto.LoginRequest;
import com.solvence.dto.RegisterRequest;
import com.solvence.dto.UserResponse;
import com.solvence.entity.User;
import com.solvence.exception.BusinessValidationException;
import com.solvence.exception.ResourceNotFoundException;
import com.solvence.repository.UserRepository;
import com.solvence.security.CurrentUserProvider;
import com.solvence.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Locale;

@Service
public class AuthenticationService {

    private static final Logger log = LoggerFactory.getLogger(AuthenticationService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CurrentUserProvider currentUserProvider;

    public AuthenticationService(UserRepository userRepository,
                                 PasswordEncoder passwordEncoder,
                                 JwtService jwtService,
                                 CurrentUserProvider currentUserProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.currentUserProvider = currentUserProvider;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessValidationException("An account with this email already exists.");
        }

        String passwordHash = passwordEncoder.encode(request.password());

        User user = new User(
                null,
                request.name().trim(),
                normalizedEmail,
                passwordHash,
                "INR",
                BigDecimal.ZERO,
                null,
                1 // Default cycle start day to 1st of the month
        );

        User savedUser;
        try {
            savedUser = userRepository.save(user);
        } catch (DataIntegrityViolationException e) {
            log.warn("Defensive uniqueness check triggered on registration for email: {}", normalizedEmail);
            throw new BusinessValidationException("An account with this email already exists.");
        }

        String token = jwtService.generateToken(savedUser.getId(), savedUser.getEmail());
        log.info("Successfully registered new user with ID: {}", savedUser.getId());
        return new AuthResponse(token, UserResponse.fromEntity(savedUser));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password."));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password.");
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        log.info("User successfully authenticated with ID: {}", user.getId());
        return new AuthResponse(token, UserResponse.fromEntity(user));
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUserProfile() {
        Long currentUserId = currentUserProvider.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + currentUserId));

        return UserResponse.fromEntity(user);
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            throw new IllegalArgumentException("Email must not be null.");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
