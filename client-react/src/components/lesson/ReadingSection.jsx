import React from "react";
import { useState, useEffect } from "react";
import { Col, Row, Typography, Image } from "antd";
import PropTypes from "prop-types";

const { Title, Paragraph } = Typography;

const ReadingSection = ({ lesson }) => {
  const [readingContent, setReadingContent] = useState(null);

  useEffect(() => {
    if (lesson) {
      let content = {
        title: lesson.title || "",
        sections: [],
        thumbnail: lesson.thumbnail || "",
      };

      if (lesson.content) {
        try {
          const parsed = JSON.parse(lesson.content);
          if (parsed.sections) {
            content = parsed;
          } else {
            content.sections = [{ heading: "Content", paragraphs: [lesson.content] }];
          }
        } catch (e) {
          content.sections = [{ heading: "Content", paragraphs: lesson.content.split('\n') }];
        }
      } else if (lesson.description) {
        content.sections = [{ heading: "Description", paragraphs: [lesson.description] }];
      }
      setReadingContent(content);
    }
  }, [lesson]);

  if (!readingContent) {
    return <div>Loading...</div>;
  }

  return (
    <div className="reading-section">
      <Row gutter={[0, 16]}>
        {readingContent.sections.map((section, index) => (
          <React.Fragment key={index}>
            <Col span={24}>
              <Title level={4}>{section.heading}</Title>
            </Col>
            <Col span={24}>
              {section.paragraphs.map((paragraph, pIndex) => (
                <div key={pIndex} className="reading-content">
                  {typeof paragraph === "string" ? (
                    <Paragraph style={{ textAlign: "left" }}>
                      {paragraph}
                    </Paragraph>
                  ) : paragraph.type === "list" ? (
                    <ul style={{ textAlign: "left", marginLeft: "1.5rem" }}>
                      {paragraph.items.map((item, i) => {
                        const colonIndex = item.indexOf(":");
                        if (colonIndex !== -1) {
                          const term = item.slice(0, colonIndex).trim();
                          const description = item.slice(colonIndex + 1).trim();
                          return (
                            <li key={i} style={{ textAlign: "left" }}>
                              <strong>{term}:</strong> {description}
                            </li>
                          );
                        }
                        return (
                          <li key={i} style={{ textAlign: "left" }}>
                            {item}
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              ))}
            </Col>
            {section.thumbnail && (
              <Col span={24}>
                <div className="responsive-image-container">
                  <Image
                    src={section.thumbnail}
                    alt={`${section.heading} thumbnail`}
                    className="responsive-image"
                  />
                </div>
              </Col>
            )}
          </React.Fragment>
        ))}
      </Row>
    </div>
  );
};

ReadingSection.propTypes = {
  lesson: PropTypes.object,
};

export default ReadingSection;