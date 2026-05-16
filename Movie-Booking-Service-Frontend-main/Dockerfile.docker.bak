FROM nginx:alpine
# Use the Docker-mode nginx config (127.0.0.11 resolver, not kube-dns)
COPY nginx.conf.docker /etc/nginx/conf.d/default.conf
COPY build/ /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
