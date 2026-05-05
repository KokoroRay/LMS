package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.QuestionTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionTagRepository extends JpaRepository<QuestionTag, Integer> {

    Optional<QuestionTag> findByTagName(String tagName);
    List<QuestionTag> findByTagNameContainingIgnoreCase(String tagName);
    boolean existsByTagName(String tagName);
}
