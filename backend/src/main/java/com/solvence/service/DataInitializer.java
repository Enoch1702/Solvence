package com.solvence.service;

import com.solvence.entity.*;
import com.solvence.repository.CategoryRepository;
import com.solvence.repository.RecurringObligationRepository;
import com.solvence.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final RecurringObligationRepository recurringObligationRepository;
    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    private final boolean devUserSeedEnabled;
    private final String devUserPassword;

    public DataInitializer(UserRepository userRepository,
                           CategoryRepository categoryRepository,
                           RecurringObligationRepository recurringObligationRepository,
                           JdbcTemplate jdbcTemplate,
                           PasswordEncoder passwordEncoder,
                           @Value("${solvence.seed.dev-user.enabled:false}") boolean devUserSeedEnabled,
                           @Value("${solvence.seed.dev-user.password:}") String devUserPassword) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.recurringObligationRepository = recurringObligationRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
        this.devUserSeedEnabled = devUserSeedEnabled;
        this.devUserPassword = devUserPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("Checking and seeding system categories...");
        seedSystemCategories();

        if (devUserSeedEnabled) {
            log.info("Development user seeding is ENABLED. Initializing dev user...");
            seedDefaultUser();
            seedDefaultRecurringObligation();
        } else {
            log.info("Development user seeding is DISABLED (production default).");
        }
    }

    private void seedDefaultUser() {
        if (userRepository.findById(1L).isEmpty()) {
            log.info("Seeding deterministic development User with ID 1...");
            String passwordHash = (devUserPassword != null && !devUserPassword.trim().isEmpty())
                    ? passwordEncoder.encode(devUserPassword)
                    : null;

            try {
                // Explicit insertion to guarantee ID 1
                jdbcTemplate.update("""
                    INSERT INTO users (id, name, email, password_hash, currency, opening_balance, hourly_rate, cycle_start_day, created_at)
                    VALUES (1, 'Solvence Dev User', 'user@solvence.local', ?, 'INR', 25000.00, 300.00, 1, NOW())
                    ON CONFLICT (id) DO NOTHING
                """, passwordHash);

                // Synchronize sequence for PostgreSQL
                try {
                    jdbcTemplate.execute("SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users))");
                } catch (Exception ex) {
                    log.debug("Sequence sync skipped or non-PostgreSQL environment: {}", ex.getMessage());
                }
            } catch (Exception e) {
                log.warn("Direct SQL insert failed, falling back to JPA save: {}", e.getMessage());
                User fallback = new User(1L, "Solvence Dev User", "user@solvence.local", passwordHash, "INR",
                        new BigDecimal("25000.00"), new BigDecimal("300.00"), 1);
                userRepository.save(fallback);
            }
        }
    }

    private void seedSystemCategories() {
        createSystemCategoryIfAbsent("Food", "food", TransactionType.EXPENSE, true);
        createSystemCategoryIfAbsent("Transport", "transport", TransactionType.EXPENSE, true);
        createSystemCategoryIfAbsent("Rent", "rent", TransactionType.EXPENSE, true);
        createSystemCategoryIfAbsent("Salary", "salary", TransactionType.INCOME, false);
        createSystemCategoryIfAbsent("Entertainment", "entertainment", TransactionType.EXPENSE, false);
        createSystemCategoryIfAbsent("Utilities", "utilities", TransactionType.EXPENSE, true);
    }

    private void createSystemCategoryIfAbsent(String name, String slug, TransactionType type, boolean isEssential) {
        if (categoryRepository.findBySlugAndUserIsNull(slug).isEmpty()) {
            Category category = new Category(null, null, name, type, isEssential, slug);
            categoryRepository.save(category);
            log.info("Seeded system category: {}", name);
        }
    }

    private void seedDefaultRecurringObligation() {
        userRepository.findById(1L).ifPresent(user -> {
            if (recurringObligationRepository.findByUserId(user.getId()).isEmpty()) {
                categoryRepository.findBySlugAndUserIsNull("rent").ifPresent(rentCategory -> {
                    RecurringObligation rent = new RecurringObligation(
                            null,
                            user,
                            rentCategory,
                            "Apartment Rent",
                            new BigDecimal("15000.00"),
                            5, // Due day 5
                            ObligationFrequency.MONTHLY,
                            true
                    );
                    recurringObligationRepository.save(rent);
                    log.info("Seeded default rent recurring obligation for User 1: ₹15,000 due day 5");
                });
            }
        });
    }
}
