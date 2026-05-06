# ==========================================
# STAGE 1: Build (Sử dụng JDK Debian để khớp với Distroless)
# ==========================================
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Sử dụng apt-get vì đây là môi trường Debian/Ubuntu
RUN apt-get update && apt-get install -y dos2unix

# Copy file cấu hình để tận dụng Layer Caching [cite: 764]
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

# Xử lý line endings và tải trước dependencies
RUN dos2unix gradlew && chmod +x gradlew && ./gradlew dependencies --no-daemon

# Build mã nguồn
COPY src src
RUN ./gradlew build -x test --no-daemon

# [Kỹ thuật jlink]: Tạo Custom JRE chỉ chứa module cần thiết [cite: 624, 707]
RUN $JAVA_HOME/bin/jlink \
    --add-modules java.base,java.sql,java.naming,java.desktop,java.management,java.security.jgss,java.instrument,jdk.crypto.ec,java.security.sasl,jdk.unsupported \
    --strip-debug \
    --no-man-pages \
    --no-header-files \
    --compress=2 \
    --output /custom-jre

# ==========================================
# STAGE 2: Runtime (Bảo mật chuẩn Enterprise)
# ==========================================
FROM gcr.io/distroless/java-base-debian12:latest
WORKDIR /app

# Copy Custom JRE và cấu hình Path [cite: 688]
COPY --from=build /custom-jre /opt/java-runtime
ENV PATH="$PATH:/opt/java-runtime/bin"

# Copy file Jar và đổi tên thành app.jar cho thống nhất
COPY --from=build /app/build/libs/*.jar app.jar

USER nobody

# Dạng mảng (Exec Form) đảm bảo PID 1 và Graceful Shutdown [cite: 654, 761]
ENTRYPOINT ["java", "-Xmx256m", "-Xms128m", "-Dspring.profiles.active=prod", "-jar", "app.jar"]