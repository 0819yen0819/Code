# 第一階段產生dist資料夾
#FROM node:alpine as builder --原來
#FROM node:lts-alpine as builder
FROM node:lts-alpine3.13 as builder

ARG VAR_BUILD_MODE
RUN echo VAR_BUILD_MODE=${VAR_BUILD_MODE}
# 指定預設/工作資料夾
WORKDIR /usr/app

# 只copy package.json檔案
#COPY ./package*.json ./
COPY . .

# 安裝dependencies
#RUN npm install && npm run ng build
RUN npm install && npm run ${VAR_BUILD_MODE}
#RUN npm install && npm run ng build --configuration=uat

# 指定建立build output資料夾，--prod為Production Mode

#RUN npm run ${VAR_BUILD_MODE:build}
#RUN npm run ${VAR_BUILD_MODE}

# pull nginx image
FROM nginxinc/nginx-unprivileged

USER root

RUN rm -rf /usr/share/nginx/html/*

# 從第一階段的檔案copy
COPY --from=builder /usr/app/dist /usr/share/nginx/html

# 覆蓋image裡的設定檔
COPY ./nginx-custom.conf /etc/nginx/conf.d/default.conf

# 伺服器憑證
COPY ./ssl_cert /etc/ssl

#ENTRYPOINT ["nginx","-g", "daemon off;"]

#EXPOSE 4200
