FROM php:8.4-cli

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    unzip \
    libzip-dev \
    libicu-dev \
    libonig-dev \
    libxml2-dev \
    libsqlite3-dev \
    sqlite3 \
    && docker-php-ext-install pdo pdo_sqlite mbstring intl bcmath zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY docker/start.sh /usr/local/bin/start-backend.sh
RUN chmod +x /usr/local/bin/start-backend.sh \
    && mkdir -p /docker \
    && cp /usr/local/bin/start-backend.sh /docker/start.sh \
    && chmod +x /docker/start.sh

EXPOSE 8000
