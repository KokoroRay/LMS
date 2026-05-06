# ==========================================
# STAGE 1: Build & Dependency Management
# Sử dụng JDK Alpine để build (nhẹ và nhanh) [cite: 2]
# ==========================================
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# [Kỹ thuật chuyên gia]: Xử lý triệt để lỗi line endings từ Windows [cite: 3, 155]
RUN apk add --no-cache dos2unix

# Copy các file cấu hình Gradle trước để tận dụng Layer Caching [cite: 2, 61, 147]
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

# Fix định dạng file thực thi và tải trước dependencies
# Bước này giúp các lần build sau cực nhanh nếu không thay đổi thư viện [cite: 4, 157, 199]
RUN dos2unix gradlew && chmod +x gradlew && ./gradlew dependencies --no-daemon

# Copy source code và tiến hành build artifact [cite: 3, 4]
COPY src src
RUN ./gradlew build -x test --no-daemon

# [Kỹ thuật chuyên gia Huỳnh Quang Tiên]: Tạo Custom JRE bằng jlink [cite: 4, 145, 200]
# Chỉ đóng gói các module cần thiết giúp giảm kích thước Image xuống tối thiểu [cite: 4, 158]
RUN $JAVA_HOME/bin/jlink \
    --add-modules java.base,java.sql,java.naming,java.desktop,java.management,java.security.jgss,java.instrument \
    --strip-debug \
    --no-man-pages \
    --no-header-files \
    --compress=2 \
    --output /custom-jre

# ==========================================
# STAGE 2: Runtime với bảo mật tối đa
# Sử dụng Distroless: Không Shell, không Package Manager [cite: 5, 144, 200]
# ==========================================
FROM gcr.io/distroless/java-base-debian12:latest
WORKDIR /app

# Copy Custom JRE đã được tinh gọn từ Stage 1 [cite: 5, 201]
COPY --from=build /custom-jre /opt/java-runtime
ENV PATH="$PATH:/opt/java-runtime/bin"

# Copy file Jar ứng dụng (Đổi tên để dễ quản lý) [cite: 5, 201]
COPY --from=build /app/build/libs/*.jar app.jar

# [Kỹ thuật chuyên gia Trịnh Thế Long]: Native Java Health Check [cite: 5, 150, 201]
# Không dùng curl (vốn không có trong Distroless) để đảm bảo an toàn [cite: 6, 214]
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD ["java", "-cp", "app.jar", "org.springframework.boot.loader.JarLauncher", "--health"]

# Chạy với quyền non-root (nobody) có sẵn trong Distroless để bảo mật [cite: 5, 201]
USER nobody

# Sử dụng Exec Form để Java nhận tín hiệu PID 1, hỗ trợ Graceful Shutdown [cite: 6, 149, 202]
ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]