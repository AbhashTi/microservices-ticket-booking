FROM nginx:alpine
# K8s mode: CoreDNS resolver + api-gateway.movie-app.svc.cluster.local
COPY nginx.conf.k8s /etc/nginx/conf.d/default.conf
COPY build/ /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
