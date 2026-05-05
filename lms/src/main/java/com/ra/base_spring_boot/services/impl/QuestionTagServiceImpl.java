package com.ra.base_spring_boot.services.impl;

import com.ra.base_spring_boot.exception.HttpConflict;
import com.ra.base_spring_boot.exception.HttpNotFound;
import com.ra.base_spring_boot.model.QuestionTag;
import com.ra.base_spring_boot.repository.QuestionTagRepository;
import com.ra.base_spring_boot.services.IQuestionTagService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class QuestionTagServiceImpl implements IQuestionTagService {

    private final QuestionTagRepository questionTagRepository;

    @Override
    public List<QuestionTag> getAllTag() {
        return questionTagRepository.findAll();
    }

    @Override
    public Page<QuestionTag> findAllTags(Pageable pageable) {
        return questionTagRepository.findAll(pageable);
    }

    @Override
    public Optional<QuestionTag> getTagById(Integer id) {
        return questionTagRepository.findById(id);
    }

    @Override
    public Optional<QuestionTag> getTagByName(String name) {
        return questionTagRepository.findByTagName(name);
    }

    @Override
    public QuestionTag createTag(QuestionTag tag) {
        if (questionTagRepository.existsByTagName(tag.getTagName())) {
            throw new HttpConflict("Tag name already exists: " + tag.getTagName());
        }

        return questionTagRepository.save(tag);
    }

    @Override
    public QuestionTag updateTag(Integer tagId, QuestionTag tag) {
        QuestionTag existingTag = questionTagRepository.findById(tagId)
                .orElseThrow(() -> new HttpNotFound("Tag not found with id: " + tagId));

        if (!existingTag.getTagName().equals(tag.getTagName()) &&
                questionTagRepository.existsByTagName(tag.getTagName())) {
            throw new HttpConflict("Tag name already exists: " + tag.getTagName());
        }

        existingTag.setTagName(tag.getTagName());
        existingTag.setDescription(tag.getDescription());

        return questionTagRepository.save(existingTag);
    }

    @Override
    public void deleteTag(Integer id) {
        QuestionTag questionTag = questionTagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found"));
        questionTagRepository.delete(questionTag);
    }

    @Override
    public List<QuestionTag> searchTagsByName(String tagName) {
        return questionTagRepository.findByTagNameContainingIgnoreCase(tagName);
    }

    @Override
    public boolean existsByTagName(String name) {
        return questionTagRepository.existsByTagName(name);
    }

    @Override
    public List<QuestionTag> getTagsByQuestionId(Integer questionId) {
        return questionTagRepository.findAll();
    }
}
