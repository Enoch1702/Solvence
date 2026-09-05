package com.solvence.repository;

import com.solvence.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    @Query("SELECT c FROM Category c WHERE c.user IS NULL OR c.user.id = :userId ORDER BY c.name ASC")
    List<Category> findAccessibleCategories(@Param("userId") Long userId);

    Optional<Category> findBySlugAndUserIsNull(String slug);

    Optional<Category> findByUserIdAndSlug(Long userId, String slug);
}
