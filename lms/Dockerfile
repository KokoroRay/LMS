# Multi-stage build for Spring Boot application
FROM eclipse-temurin:17-jdk-alpine AS build

# Set working directory
WORKDIR /app

# Copy gradle wrapper and build files
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

# Make gradlew executable and fix line endings
RUN chmod +x ./gradlew && \
    apk add --no-cache dos2unix && \
    dos2unix ./gradlew

# Copy source code
COPY src src

# Build the application
RUN ./gradlew build -x test --no-daemon \
    -Dorg.gradle.internal.http.connectionTimeout=120000 \
    -Dorg.gradle.internal.http.socketTimeout=120000

# Runtime stage
FROM eclipse-temurin:17-jre-alpine

# Install necessary packages for Alpine Linux
RUN apk add --no-cache curl

# Create application user for Alpine Linux
RUN addgroup -S spring && adduser -S spring -G spring

# Set working directory
WORKDIR /app

# Copy the built jar from build stage
COPY --from=build /app/build/libs/*.jar app.jar

# Change ownership of the app directory
RUN chown -R spring:spring /app

# Switch to application user
USER spring

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application with prod profile
ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]