# Use a lightweight nginx image
FROM nginx:alpine

# Copy your static site into nginx default folder
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]