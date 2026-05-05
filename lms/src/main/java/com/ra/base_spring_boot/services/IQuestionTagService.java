package com.ra.base_spring_boot.services;

import com.ra.base_spring_boot.model.QuestionTag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Optional;

public interface IQuestionTagService {

    List<QuestionTag> getAllTag();

    Page<QuestionTag> findAllTags(Pageable pageable);

    Optional<QuestionTag> getTagById(Integer id);

    Optional<QuestionTag> getTagByName(String name);

    QuestionTag createTag(QuestionTag tag);

    QuestionTag updateTag(Integer id, QuestionTag tag);

    void deleteTag(Integer id);

    List<QuestionTag> searchTagsByName(String tagName);

    boolean existsByTagName(String name);

    List<QuestionTag> getTagsByQuestionId(Integer questionId);

}
