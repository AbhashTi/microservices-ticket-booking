FROM nginx:alpine
COPY nginx.conf.k8s /etc/nginx/conf.d/default.conf
COPY build/ /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
