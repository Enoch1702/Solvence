package com.solvence.dto;

import com.solvence.entity.Category;
import com.solvence.entity.TransactionType;

public record CategoryResponse(
        Long id,
        Long userId,
        String name,
        TransactionType type,
        boolean isEssential,
        String slug
) {
    public static CategoryResponse fromEntity(Category category) {
        Long userId = category.getUser() != null ? category.getUser().getId() : null;
        return new CategoryResponse(
                category.getId(),
                userId,
                category.getName(),
                category.getType(),
                category.isEssential(),
                category.getSlug()
        );
    }
}
