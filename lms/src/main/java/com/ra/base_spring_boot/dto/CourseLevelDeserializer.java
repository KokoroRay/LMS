package com.ra.base_spring_boot.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.ra.base_spring_boot.model.constants.CourseLevel;

import java.io.IOException;

public class CourseLevelDeserializer extends JsonDeserializer<CourseLevel> {

    @Override
    public CourseLevel deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String value = p.getText();
        if (value == null) return null;
        for (CourseLevel level : CourseLevel.values()) {
            if (level.name().equalsIgnoreCase(value)) {
                return level;
            }
        }
        return null; // hoặc ném exception nếu muốn bắt lỗi
    }
}
